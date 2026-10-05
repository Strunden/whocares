const encoder = new TextEncoder();
const decoder = new TextDecoder();

function concat(a, b) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function viewOf(bytes) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

function u32(n) {
  const bytes = new Uint8Array(4);
  viewOf(bytes).setUint32(0, n);
  return bytes;
}

function bytesOf(...parts) {
  const len = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(len);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function cstr(value) {
  return encoder.encode(`${value}\0`);
}

function b64(bytes) {
  let text = "";
  for (const byte of bytes) text += String.fromCharCode(byte);
  return btoa(text);
}

function unb64(text) {
  const raw = atob(text);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

function xor(a, b) {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i += 1) out[i] = a[i] ^ b[i];
  return out;
}

function saslName(value) {
  return String(value).replace(/=/g, "=3D").replace(/,/g, "=2C");
}

async function sha256(bytes) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

async function hmac(keyBytes, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const data = typeof message === "string" ? encoder.encode(message) : message;
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, data));
}

async function md5Hex(bytes) {
  const digest = await crypto.subtle.digest("MD5", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function md5Password(user, password, salt) {
  const inner = await md5Hex(encoder.encode(`${password}${user}`));
  const outer = await md5Hex(concat(encoder.encode(inner), salt));
  return `md5${outer}`;
}

async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256,
  );
  return new Uint8Array(bits);
}

function connectionConfig(env) {
  const drive = env.HYPERDRIVE;
  if (drive && drive.host) {
    return {
      host: drive.host,
      port: Number(drive.port || 5432),
      user: drive.user,
      password: drive.password || "",
      database: drive.database,
      ssl: false,
    };
  }
  if (!env.DATABASE_URL) return null;
  const url = new URL(env.DATABASE_URL);
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    ssl: url.searchParams.get("sslmode") !== "disable",
  };
}

export class PgConn {
  constructor(reader, writer, closer) {
    this.reader = reader;
    this.writer = writer;
    this.closer = closer;
    this.buf = new Uint8Array(0);
  }

  async write(bytes) {
    await this.writer.write(bytes);
  }

  async readExact(n) {
    while (this.buf.length < n) {
      const { done, value } = await this.reader.read();
      if (done) throw new Error("database connection closed");
      this.buf = concat(this.buf, value);
    }
    const out = this.buf.slice(0, n);
    this.buf = this.buf.slice(n);
    return out;
  }

  async readByte() {
    return (await this.readExact(1))[0];
  }

  async readMessage() {
    const type = String.fromCharCode(await this.readByte());
    const len = viewOf(await this.readExact(4)).getUint32(0);
    const body = await this.readExact(len - 4);
    return { type, body };
  }

  async startup(user, database) {
    const body = bytesOf(
      u32(196608),
      cstr("user"),
      cstr(user),
      cstr("database"),
      cstr(database),
      new Uint8Array([0]),
    );
    await this.write(bytesOf(u32(body.length + 4), body));
  }

  async password(secret) {
    const payload = cstr(secret);
    await this.write(bytesOf(encoder.encode("p"), u32(payload.length + 4), payload));
  }

  async saslInitial(user) {
    const nonceBytes = new Uint8Array(18);
    crypto.getRandomValues(nonceBytes);
    const nonce = b64(nonceBytes);
    const bare = `n=${saslName(user)},r=${nonce}`;
    const clientFirst = `n,,${bare}`;
    const mechanism = cstr("SCRAM-SHA-256");
    const first = encoder.encode(clientFirst);
    const payload = bytesOf(mechanism, u32(first.length), first);
    await this.write(bytesOf(encoder.encode("p"), u32(payload.length + 4), payload));
    return { nonce, bare, clientFirst };
  }

  async saslFinal(password, state, serverFirst) {
    const parts = Object.fromEntries(
      serverFirst.split(",").map((item) => {
        const idx = item.indexOf("=");
        return [item.slice(0, idx), item.slice(idx + 1)];
      }),
    );
    if (!parts.r || !parts.r.startsWith(state.nonce)) {
      throw new Error("database auth rejected the client nonce");
    }
    const salt = unb64(parts.s);
    const iterations = Number(parts.i);
    const salted = await pbkdf2(password, salt, iterations);
    const clientKey = await hmac(salted, "Client Key");
    const storedKey = await sha256(clientKey);
    const withoutProof = `c=biws,r=${parts.r}`;
    const authMessage = `${state.bare},${serverFirst},${withoutProof}`;
    const proof = xor(clientKey, await hmac(storedKey, authMessage));
    const finalMessage = `${withoutProof},p=${b64(proof)}`;
    const payload = encoder.encode(finalMessage);
    await this.write(bytesOf(encoder.encode("p"), u32(payload.length + 4), payload));
  }

  async authenticate(user, password) {
    let scram = null;
    while (true) {
      const msg = await this.readMessage();
      if (msg.type === "E") throw new Error(errorText(msg.body));
      if (msg.type === "Z") return;
      if (msg.type !== "R") continue;
      const code = viewOf(msg.body).getUint32(0);
      if (code === 0 || code === 12) continue;
      if (code === 3) {
        await this.password(password);
      } else if (code === 5) {
        await this.password(await md5Password(user, password, msg.body.slice(4, 8)));
      } else if (code === 10) {
        scram = await this.saslInitial(user);
      } else if (code === 11) {
        const serverFirst = decoder.decode(msg.body.slice(4));
        await this.saslFinal(password, scram, serverFirst);
      } else {
        throw new Error(`unsupported database auth (${code})`);
      }
    }
  }

  async simpleQuery(sql) {
    const payload = cstr(sql);
    await this.write(bytesOf(encoder.encode("Q"), u32(payload.length + 4), payload));
    let columns = [];
    const rows = [];
    while (true) {
      const msg = await this.readMessage();
      if (msg.type === "T") columns = rowDescription(msg.body);
      else if (msg.type === "D") rows.push(dataRow(msg.body, columns));
      else if (msg.type === "Z") return rows;
      else if (msg.type === "E") throw new Error(errorText(msg.body));
    }
  }

  async close() {
    try {
      await this.write(bytesOf(encoder.encode("X"), u32(4)));
    } catch {
      // The socket may already be closed.
    }
    try {
      this.writer.releaseLock();
    } catch {
      // Already released.
    }
    await this.closer();
  }
}

function errorText(body) {
  let text = "database error";
  let i = 0;
  while (i < body.length && body[i] !== 0) {
    const field = String.fromCharCode(body[i]);
    i += 1;
    let end = i;
    while (end < body.length && body[end] !== 0) end += 1;
    const value = decoder.decode(body.slice(i, end));
    if (field === "M" && value) text = value;
    i = end + 1;
  }
  return text;
}

function rowDescription(body) {
  const count = viewOf(body).getUint16(0);
  const columns = [];
  let offset = 2;
  for (let i = 0; i < count; i += 1) {
    let end = offset;
    while (body[end] !== 0) end += 1;
    columns.push(decoder.decode(body.slice(offset, end)));
    offset = end + 1 + 18;
  }
  return columns;
}

function dataRow(body, columns) {
  const count = viewOf(body).getUint16(0);
  const row = {};
  let offset = 2;
  const view = viewOf(body);
  for (let i = 0; i < count; i += 1) {
    const len = view.getInt32(offset);
    offset += 4;
    const name = columns[i] || String(i);
    if (len < 0) row[name] = null;
    else {
      row[name] = decoder.decode(body.slice(offset, offset + len));
      offset += len;
    }
  }
  return row;
}

async function openSocket(cfg) {
  const { connect } = await import("cloudflare:sockets");
  const socket = connect(`${cfg.host}:${cfg.port}`);
  let reader = socket.readable.getReader();
  let writer = socket.writable.getWriter();
  const closer = async () => {
    try {
      await socket.close();
    } catch {
      // Already closed.
    }
  };
  if (!cfg.ssl) return new PgConn(reader, writer, closer);

  await writer.write(bytesOf(u32(8), u32(80877103)));
  const answer = new Uint8Array(1);
  const first = await reader.read();
  if (first.done || !first.value || first.value.length < 1) {
    throw new Error("database did not answer the TLS request");
  }
  answer[0] = first.value[0];
  const rest = first.value.slice(1);
  if (answer[0] !== 83) throw new Error("database refused TLS");
  writer.releaseLock();
  reader.releaseLock();
  const tls = socket.startTls({ servername: cfg.host });
  reader = tls.readable.getReader();
  writer = tls.writable.getWriter();
  const conn = new PgConn(reader, writer, closer);
  if (rest.length) conn.buf = rest;
  return conn;
}

export async function withSql(env, fn) {
  const cfg = connectionConfig(env);
  if (!cfg) {
    const error = new Error("database unconfigured");
    error.code = "UNCONFIGURED";
    throw error;
  }
  const conn = await openSocket(cfg);
  try {
    await conn.startup(cfg.user, cfg.database);
    await conn.authenticate(cfg.user, cfg.password);
    return await fn(conn);
  } finally {
    await conn.close();
  }
}
