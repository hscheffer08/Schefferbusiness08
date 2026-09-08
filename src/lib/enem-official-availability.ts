const unavailable:Record<number,readonly number[]>={
  2019:[1,2,3,4,5,98,100,113,128,136,139,165],
  2020:[1,2,3,4,5,93,113,137,142,144,147,149,155,157,161,163,166,168,170,175,176,177,179],
  2021:[1,2,3,4,5,91,102,105,126,135,137,138,152,161,162,163,175,179],
  2022:[1,2,3,4,5,95,96,103,106,108,137,141,143,144,148,155,156,157,159,160,166,180],
  2023:[1,2,3,4,5,34,110,113,132,141,145,148,163,168,169,173,174,177,178],
  2024:[],
  2025:[],
};

export function isEnemInteractiveQuestion(year:number,questionNumber:number){
  return year>=2019&&year<=2025&&questionNumber>=1&&questionNumber<=180&&!unavailable[year]?.includes(questionNumber);
}

export const ENEM_INTERACTIVE_TOTAL=Object.entries(unavailable).reduce((total,[,missing])=>total+180-missing.length,0);
