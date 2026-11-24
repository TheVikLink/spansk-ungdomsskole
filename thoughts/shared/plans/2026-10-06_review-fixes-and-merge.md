# Rett review-funn og lever de sju læringsforbedringene

Brukeren har 6. oktober autorisert retting av ojzi og bd4o, deretter commit, push og fletting til main. Arbeid på codex/small-learning-improvements; bevar annet Feide-/kulturarbeid i hovedarbeidsmappen.

Importen skal foretrekke et eksisterende komplett ordpar før skråstrekalternativer deles. Nye alternativer må finnes gjennom samme regel i pakkeoppslaget, også etter omlasting, eldre backup og gjentatt import. Den generelle lærerordimportens standardoppførsel beholdes. Importmeldingen skal telle faktisk tilgjengelige nye/eksisterende kort og vise en tydelig feil når pakken har gloser uten tilgjengelige kort. Gyldige pakker bare med verb eller grammatikk skal fortsatt lykkes. Ingen endring i assignment-v1, kanoniske ord/svar eller eksisterende kortfremgang; ingen sletting av eldre ekstra kort.

Kontrastrettingen bruker en mørkere eksisterende Tailwind-farge for de tre feltfeilene og samlet builderstatus, med minst 4,5:1. ARIA og fokus beholdes.

For hver feil: kjør en reproduksjon rød, implementer minste retting og kjør nærtestene grønt. Verifiser alle standardkategorier, faktisk filoverlevering, nye alternativer, reimport, eksport/import og feiltilstander. Kjør build:app og test:all i faktisk arbeidsmappe før commit. Kontroller også relevante WebKit-tester og mobil-/desktopskjermbilder. Lag PR med konkret beskrivelse og testbevis, vent på CI og merge når grønn. Kontroller main og den automatiske nettsideleveransen etter fletting. Beads eier live status.
