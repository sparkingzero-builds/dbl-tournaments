"""
Scrape character kit data from dblegends.net for all characters in characters.json.
Extracts data from embedded script elements (id=data, tr, ab, am).
Saves to data/character_kits.json
"""
import json
import time
import re
import sys
from urllib.request import urlopen, Request

def fetch_kit(char_id):
    """Fetch and extract kit data for a single character."""
    req = Request(
        f'https://dblegends.net/character/{char_id}',
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
    )
    html = urlopen(req, timeout=15).read().decode('utf-8', errors='replace')

    # Extract embedded JSON data from script/template tags
    pattern = r'<(?:script|template)\s+[^>]*id=["\x27](\w+)["\x27][^>]*>(.*?)</(?:script|template)>'
    raw = {m[0]: m[1] for m in re.findall(pattern, html, re.S)}

    kit = {}

    # Main character data
    if 'data' in raw:
        try:
            data = json.loads(raw['data'])
            cdata = data.get(str(char_id), {})
            kit['stats'] = {
                'health': cdata.get('max', {}).get('hp', 0),
                'strike_atk': cdata.get('max', {}).get('sa', 0),
                'blast_atk': cdata.get('max', {}).get('ba', 0),
                'strike_def': cdata.get('max', {}).get('sd', 0),
                'blast_def': cdata.get('max', {}).get('bd', 0),
                'critical': cdata.get('lk', 0),
                'ki_restore': cdata.get('ki', 0),
            }
            kit['card_id'] = cdata.get('card', '')
            kit['element'] = cdata.get('el', '')
            kit['rarity'] = cdata.get('rarity', '')
        except:
            pass

    # Traits and tags
    if 'tr' in raw:
        try:
            tr = json.loads(raw['tr'])
            kit['tags'] = []
            kit['traits'] = []
            for tid, val in tr.items():
                name = val[0] if isinstance(val, list) else str(val)
                desc = val[1] if isinstance(val, list) and len(val) > 1 else ''
                tid_int = int(tid)
                if tid_int >= 8200000:
                    kit['traits'].append({'name': name, 'description': desc})
                else:
                    kit['tags'].append(name)
        except:
            pass

    # Abilities
    if 'ab' in raw:
        try:
            ab = json.loads(raw['ab'])
            kit['unique_abilities'] = []
            kit['main_ability'] = None
            kit['z_abilities'] = []

            for aid, val in ab.items():
                if not isinstance(val, list) or len(val) < 2:
                    continue
                name = val[0]
                desc = val[1]
                aid_int = int(aid)

                # Main ability IDs start with 100{charid}010
                if str(aid_int).endswith('010') and len(str(aid_int)) > 6:
                    kit['main_ability'] = {'name': name, 'description': desc}
                # Z abilities are 5{x}{charid}
                elif str(aid_int).startswith('5'):
                    kit['z_abilities'].append({'name': name, 'description': desc})
                # Legend action
                elif str(aid_int).endswith('150'):
                    kit['legend_action'] = {'name': name, 'description': desc}
                # Unique abilities
                elif name:
                    kit['unique_abilities'].append({'name': name, 'description': desc})
        except:
            pass

    # Arts/moves
    if 'am' in raw:
        try:
            am = json.loads(raw['am'])
            kit['arts_cards'] = []
            for mid, val in am.items():
                if isinstance(val, list) and len(val) >= 2:
                    kit['arts_cards'].append({
                        'name': val[0],
                        'description': val[1]
                    })
        except:
            pass

    return kit


def main():
    with open('data/characters.json', 'r', encoding='utf-8') as f:
        characters = json.load(f)

    # Load existing progress
    try:
        with open('data/character_kits.json', 'r', encoding='utf-8') as f:
            kits = json.load(f)
    except:
        kits = {}

    total = len(characters)
    for idx, char in enumerate(characters):
        cid = str(char['id'])
        if cid in kits:
            continue

        sys.stdout.write(f"\r[{idx+1}/{total}] {char['name'][:40]}...")
        sys.stdout.flush()
        try:
            kit = fetch_kit(char['id'])
            kit['id'] = char['id']
            kit['name'] = char['name']
            kits[cid] = kit
            time.sleep(0.25)
        except Exception as e:
            kits[cid] = {'id': char['id'], 'name': char['name'], 'error': str(e)}

        # Save every 20
        if (idx + 1) % 20 == 0:
            with open('data/character_kits.json', 'w', encoding='utf-8') as f:
                json.dump(kits, f, ensure_ascii=False, separators=(',', ':'))
            sys.stdout.write(f" [saved {len(kits)}]")

    with open('data/character_kits.json', 'w', encoding='utf-8') as f:
        json.dump(kits, f, ensure_ascii=False, separators=(',', ':'))
    print(f"\nDone! {len(kits)} kits saved.")


if __name__ == '__main__':
    main()
