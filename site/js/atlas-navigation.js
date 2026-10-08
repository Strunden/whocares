// Legacy collection labels are navigation metadata, not evidence-backed problems.
export const collectionLabels={P01:'Selling the family home',P02:'Inheritance at death',P03:'Leaving hospital',P04:'Work at pension age',P05:'Private health premiums',P06:'Funerals',P07:'Gifts while alive',T01:'Lifting and transfers',T02:'Incontinence care',T03:'Medicines and packs',T04:'Falls at home',T05:'Check-ups after 65',T06:'Dementia support',T07:'Loneliness',T08:'Adapting the home',T09:'Getting around',T10:'Meals and swallowing',T11:'Family caregivers',T12:'Care at the end',T13:'Care admin',T14:'Hiring care staff',T15:'Hearing aids',T16:'Clinic tools',T17:'Heat and crises',T18:'Who pays for care'};
export function availableStory(narrative,records){
 return {...narrative,beats:narrative.beats.map(beat=>{
  const ids=beat.ids.filter(id=>records.has(id)),focus=records.has(beat.focus)?beat.focus:null;
  return {...beat,ids,focus,evidence:ids.length!==beat.ids.length||!focus?
   'This scene is illustrative. Earlier analyst links have been archived and do not establish this situation. Any remaining product links describe offerings, not observed experience or effectiveness.':beat.evidence};
 })};
}
