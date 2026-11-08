"""Author original beginner songs, separate from popular-song discovery entries."""

import json
from pathlib import Path
from uuid import NAMESPACE_URL, uuid5

root = Path(__file__).resolve().parents[1]
source = "https://github.com/rayyanhasan899/Chord-House"
grant = dict(
    origin="application",
    license="Original project content",
    source_url=source,
    attribution="Chord House original learning songs",
    evidence=(
        "New lyrics and chord exercises authored for this project, "
        "not adapted from a named third-party song."
    ),
    terms_version="Original pack 1 / 2026-11-08",
    reviewer="Chord House editorial review",
    reviewed=True,
    display=True,
    cache=True,
    transpose=True,
    territories=["*"],
    expires_at=None,
)
songs = [
    (
        "en",
        "One More Morning",
        [],
        [
            "The window holds a square of light",
            "I let the quiet leave the night",
            "One open string, one steady hand",
            "A little tune is where I stand",
            "One more morning, one more try",
            "Let the small notes climb the sky",
            "If I stumble, I can stay",
            "And find the beat another way",
            "The room is still, the clock is slow",
            "I give each chord a place to grow",
            "No race to win, no crowd to see",
            "This little song belongs to me",
        ],
        None,
    ),
    (
        "en",
        "Lantern on the Table",
        [],
        [
            "A lantern on the table glows",
            "The evening settles, no one knows",
            "How many times I missed this change",
            "And made the silence feel less strange",
            "Hold the beat and breathe again",
            "Every note can be a friend",
            "Let the ringing fill the room",
            "Like a seed that learns to bloom",
            "The final chord can fade away",
            "I keep the part I learned today",
            "Tomorrow brings a softer hand",
            "And one more tune I understand",
        ],
        None,
    ),
    (
        "ur",
        "Aik Nayi Subah",
        ["Ek Nayi Subah", "ایک نئی صبح"],
        [
            "Khidki se roshni aayi",
            "Dil ne aik dhun banayi",
            "Taar ko aahista chhero",
            "Apni saanson ko suno",
            "Aik nayi subah, aik naya raag",
            "Chhoti koshish, roshan raah",
            "Bhool ho to phir se gaao",
            "Dheere dheere aage aao",
            "Shaam ko jab ghar mein aao",
            "Aaj ka seekha yaad dilao",
            "Har nayi dhun saath nibhaaye",
            "Dil ko apni raah dikhaaye",
        ],
        [
            "کھڑکی سے روشنی آئی",
            "دل نے ایک دھن بنائی",
            "تار کو آہستہ چھیڑو",
            "اپنی سانسوں کو سنو",
            "ایک نئی صبح، ایک نیا راگ",
            "چھوٹی کوشش، روشن راہ",
            "بھول ہو تو پھر سے گاؤ",
            "دھیرے دھیرے آگے آؤ",
            "شام کو جب گھر میں آؤ",
            "آج کا سیکھا یاد دلاؤ",
            "ہر نئی دھن ساتھ نبھائے",
            "دل کو اپنی راہ دکھائے",
        ],
    ),
    (
        "ur",
        "Chhota Sa Safar",
        ["Chota Sa Safar", "چھوٹا سا سفر"],
        [
            "Mez pe rakha mera saaz",
            "Chupke se deta hai aawaaz",
            "Aaj zara sa waqt nikaala",
            "Dil ka aik kona ujaala",
            "Chhota sa safar hai mera",
            "Har sur mein hai naya savera",
            "Jaldi kya hai, saath to chalo",
            "Aik aik qadam pe dhun ko suno",
            "Ungli rukti, phir chalti hai",
            "Dhun bhi mere saath badalti hai",
            "Aaj ki mehnat kal muskuraaye",
            "Apna saaz mujhe ghar bulaaye",
        ],
        None,
    ),
    (
        "hi",
        "Nayi Dhoop",
        ["नई धूप", "Nai Dhoop"],
        [
            "Aangan mein nayi dhoop aayi",
            "Maine halki taan sunaayi",
            "Dheere se ik taar bajaaya",
            "Chhota sa ik geet banaaya",
            "Nayi dhoop aur nayi kahaani",
            "Seekh raha hoon dhun puraani",
            "Gir kar phir se uth jaaunga",
            "Apni lay mein gaata jaaunga",
            "Shaam dhale jab deep jalaaoon",
            "Aaj ki mehnat yaad dilaaoon",
            "Kal ki raah ab paas lagegi",
            "Har koshish ek aas banegi",
        ],
        [
            "आँगन में नई धूप आई",
            "मैंने हल्की तान सुनाई",
            "धीरे से इक तार बजाया",
            "छोटा सा इक गीत बनाया",
            "नई धूप और नई कहानी",
            "सीख रहा हूँ धुन पुरानी",
            "गिर कर फिर से उठ जाऊँगा",
            "अपनी लय में गाता जाऊँगा",
            "शाम ढले जब दीप जलाऊँ",
            "आज की मेहनत याद दिलाऊँ",
            "कल की राह अब पास लगेगी",
            "हर कोशिश एक आस बनेगी",
        ],
    ),
    (
        "hi",
        "Dheere Chalo",
        ["धीरे चलो"],
        [
            "Raaste par ped khade hain",
            "Patton mein kuchh sur chhupe hain",
            "Baith ke unko aaj suno tum",
            "Apni dhun mein saath buno tum",
            "Dheere chalo, lay ko paao",
            "Har ik sur se haath milaao",
            "Chhoti dhun bhi door chalegi",
            "Mann ki khidki aaj khulegi",
            "Kal jo mushkil lagta tha",
            "Aaj zara aasaan hua",
            "Ek kadam aur ek nishaana",
            "Roz naya kuchh seekhte jaana",
        ],
        None,
    ),
]
items = []
for language, title, aliases, lines, native in songs:
    key = "original:" + language + ":" + title.lower().replace(" ", "-")
    texts = [
        dict(
            key="roman" if language != "en" else "english",
            language=language,
            script="Latn",
            label="English lyrics"
            if language == "en"
            else "Roman Urdu"
            if language == "ur"
            else "Roman Hindi",
            lines=lines,
            grant=grant,
        )
    ]
    if native:
        texts.append(
            dict(
                key="native",
                language=language,
                script="Arab" if language == "ur" else "Deva",
                label="Urdu script" if language == "ur" else "Hindi script",
                lines=native,
                grant=grant,
            )
        )
    arrangements = []
    for instrument in ("guitar", "bass", "ukulele"):
        progression = ["C", "Am", "F", "G"]
        arrangements.append(
            dict(
                key=instrument + "-standard",
                name="Original 4/4 chord exercise",
                instrument=instrument,
                tuning="reentrant" if instrument == "ukulele" else "standard",
                difficulty="beginner",
                capo=0 if instrument == "guitar" else None,
                key_note="C",
                chords=progression,
                placements=[
                    dict(line=i, offset=0, chord=progression[i % 4])
                    for i in range(len(lines))
                ],
                text_key=texts[0]["key"],
                pattern_id=str(
                    uuid5(NAMESPACE_URL, "chord-house:pattern:Quarter-note foundation")
                ),
                guidance=(
                    "Original chord-and-lyric practice song: one 4/4 measure "
                    "per line, four even downstrokes, suggested 60–90 BPM. "
                    "No melody or vocal recording is supplied; speak or "
                    "sing freely over the chords. Bass entries are "
                    "chord-tone exercises rather than a recorded bass line. "
                    "Use comfortable voicings from the diagrams."
                ),
                grant=grant,
            )
        )
    items.append(
        dict(
            external_key=key,
            title=title,
            artist="Chord House Originals",
            language=language,
            aliases=aliases,
            genre="Original practice song",
            metadata_grant=grant,
            arrangements=arrangements,
            texts=texts,
            lyrics_url=None,
            lyrics_link_verified=False,
        )
    )
path = root / "backend/app/modules/catalog/data/original-songs.json"
path.parent.mkdir(exist_ok=True)
path.write_text(
    json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
)
print(f"Wrote {len(items)} original songs; not popular-song arrangements.")
