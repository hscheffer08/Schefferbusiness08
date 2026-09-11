export function hasUnexpectedControlCharacters(value: unknown) {
  const text=String(value??'');
  for(let i=0;i<text.length;i++){
    const code=text.charCodeAt(i);
    if((code>=0&&code<=8)||code===11||code===12||(code>=14&&code<=31))return true;
  }
  return false;
}
