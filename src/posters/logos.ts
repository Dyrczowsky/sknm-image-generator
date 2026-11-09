// Sygnet SKNM (herb koła) - warianty kolorystyczne pod różne tła.
import sygnetNegatywny from '../assets/brand/sknm/sygnet_negatywny.svg'
import sygnetGranat from '../assets/brand/sknm/sygnet_granat.svg'
import sygnetZloty from '../assets/brand/sknm/sygnet_zloty.svg'
import sygnetSzary from '../assets/brand/sknm/sygnet_szary.svg'
import sygnetCzarny from '../assets/brand/sknm/sygnet_czarny.svg'
import sygnetSrebrny from '../assets/brand/sknm/sygnet_srebrny.svg'
import type { LogoVariant, PkLogoKind, SygnetName } from '../types'

// Wybór sygnetu po nazwie roli ze schematu (patrz schemes.ts).
export const sygnetByName: Record<SygnetName, string> = {
  negatywny: sygnetNegatywny,
  granat: sygnetGranat,
  zloty: sygnetZloty,
  szary: sygnetSzary,
  czarny: sygnetCzarny,
  srebrny: sygnetSrebrny,
}

// Logo Politechniki Krakowskiej w stopce - samo PK, PK z Wydziałem Informatyki
// i Matematyki albo dodatkowo z Katedrą Matematyki Stosowanej (wybór
// w „Wyglądzie"), w wariancie pod tło plakatu.
import pkLight from '../assets/brand/pk/PK_POZIOM.svg'
import pkDark from '../assets/brand/pk/PK_POZIOM_inwersyjne.svg'
import wiimLight from '../assets/brand/pk/PK_WIiM_RGB.svg'
import wiimDark from '../assets/brand/pk/PK_WIiM_inwersyjne.svg'
import kmsLight from '../assets/brand/pk/PK_WIiM_KMS_RGB.svg'
import kmsDark from '../assets/brand/pk/PK_WIiM_KMS_biale.svg'
import sknmLight from '../assets/brand/sknm/logo_granat.svg'
import sknmDark from '../assets/brand/sknm/logo_negatywny.svg'

export const pkLogos: Record<PkLogoKind, Record<LogoVariant, string>> = {
  pk: { light: pkLight, dark: pkDark },
  wiim: { light: wiimLight, dark: wiimDark },
  kms: { light: kmsLight, dark: kmsDark },
}

// Logo SKNM (sygnet + nazwa koła) w stopce, po logo PK - granatowe na jasnym
// tle, białe na ciemnym.
export const sknmLogos: Record<LogoVariant, string> = { light: sknmLight, dark: sknmDark }
