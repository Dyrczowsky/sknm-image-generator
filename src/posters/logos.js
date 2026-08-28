// Sygnet SKNM (herb koła) - warianty kolorystyczne pod różne tła.
import sygnetNegatywny from '../assets/brand/sknm/sygnet_negatywny.svg'
import sygnetGranat from '../assets/brand/sknm/sygnet_granat.svg'
import sygnetZloty from '../assets/brand/sknm/sygnet_zloty.svg'
import sygnetSzary from '../assets/brand/sknm/sygnet_szary.svg'
import sygnetCzarny from '../assets/brand/sknm/sygnet_czarny.svg'

export { sygnetNegatywny, sygnetGranat, sygnetZloty, sygnetSzary, sygnetCzarny }

// Wybór sygnetu po nazwie roli ze schematu (patrz schemes.js).
export const sygnetByName = {
  negatywny: sygnetNegatywny,
  granat: sygnetGranat,
  zloty: sygnetZloty,
  szary: sygnetSzary,
  czarny: sygnetCzarny,
}

// Logo Politechniki Krakowskiej - domyślne logo w miejscach na logo PK/wydziału,
// dopóki użytkownik nie wgra własnego pliku w formularzu.
export { default as pkLogoLight } from '../assets/brand/pk/PK_POZIOM.svg'
export { default as pkLogoDark } from '../assets/brand/pk/PK_POZIOM_inwersyjne.svg'
