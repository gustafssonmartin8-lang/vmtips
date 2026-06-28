// Short names for mobile displays
export const SHORT_NAME = {
  'Bosnien-Hercegovina': 'Bosnien',
  'Elfenbenskusten': 'Elfenb.',
  'Kongo-Kinshasa': 'Kongo',
  'Saudiarabien': 'Saudiarb.',
  'Nya Zeeland': 'Nya Zel.',
  'Sydkorea': 'S-Korea',
  'Sydafrika': 'S-Afrika',
  'Nederländerna': 'Nederl.',
  'Australien': 'Austr.',
  'Kap Verde': 'Kap V.',
}

export const shortName = (team, mobile = false) => {
  if (!mobile) return team
  return SHORT_NAME[team] || team
}
