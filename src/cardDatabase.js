// ══════════════════════ DATABASE KARTU POKEMON TCG ══════════════════════
// Klasik (Base Set) → Scarlet & Violet → Mega Evolution 2026
// Tambah kartu baru ke array kategori yang sesuai, atau langsung dari UI.

export const CARD_DB = {
  pokemon: [
    // Klasik
    'Pikachu','Charizard','Blastoise','Venusaur','Mewtwo','Mew','Gyarados','Alakazam',
    'Machamp','Gengar','Dragonite','Snorlax','Articuno','Zapdos','Moltres','Eevee',
    'Vaporeon','Jolteon','Flareon','Lapras','Ditto','Raichu','Ninetales','Arcanine',
    'Poliwrath','Slowbro','Magneton','Cloyster','Haunter','Hypno','Chansey','Kangaskhan',
    'Scyther','Electabuzz','Magmar','Pinsir','Tauros','Magikarp','Lapras','Porygon',
    // GX / V / VSTAR / VMAX era
    'Pikachu & Zekrom GX','Charizard GX','Reshiram & Charizard GX','Mewtwo & Mew GX',
    'Lugia VSTAR','Giratina VSTAR','Arceus VSTAR','Mew VMAX','Origin Forme Palkia VSTAR',
    'Regidrago VSTAR','Rapid Strike Urshifu VMAX','Inteleon VMAX','Charizard VSTAR',
    'Espeon VMAX','Umbreon VMAX','Glaceon VSTAR','Kyurem VMAX','Zacian V','Zamazenta V',
    'Celebi V','Crobat V','Dedenne GX','Gengar & Mimikyu GX','Marnie\'s Toxapex GX',
    // Scarlet & Violet ex era
    'Charizard ex','Gardevoir ex','Dragapult ex','Raging Bolt ex','Iron Hands ex',
    'Roaring Moon ex','Ceruledge ex','Terapagos ex','Joltik','Galvantula ex',
    'Pidgeot ex','Chien-Pao ex','Miraidon ex','Koraidon ex','Tyranitar ex',
    'Gholdengo ex','Greninja ex','Ogerpon ex','Pecharunt ex','Gouging Fire ex',
    'Iron Boulder ex','Brute Bonnet ex','Sandy Shocks ex','Iron Thorns ex',
    // Mega Evolution 2026 (Standard)
    'Mega Lucario ex','Mega Starmie ex','Mega Absol ex','Mega Diancie ex',
    'Mega Charizard ex','Mega Gardevoir ex','Mega Venusaur ex','Mega Lopunny ex',
    'Mega Tyranitar ex','Mega Banette ex','Mega Gyarados ex','Mega Aerodactyl ex',
    'Mega Manectric ex','Mega Sceptile ex','Mega Kangaskhan ex','Mega Blastoise ex',
    'Mega Steelix ex','Mega Rayquaza ex','Mega Mewtwo ex','Mega Houndoom ex',
    'Mega Altaria ex','Mega Pidgeot ex','Mega Garchomp ex','Mega Medicham ex',
    'Mega Alakazam ex','Mega Ampharos ex','Mega Slowbro ex','Mega Latias ex',
    'Mega Latios ex','Mega Swampert ex','Mega Blaziken ex',
    // Toolbox / single prize
    'Munkidori','Dusknoir','Hydrapple ex','Comfey','Bibarel','Flareon ex',
    'Snorlax (Stall)','Klawf','Froslass','Noctowl','Archaludon ex','Riolu',
    'Solrock','Lunatone','Hariyama','Meowth ex','Yveltal','Celebi','Tapu Bulu',
    'Lumineon V','Radiant Greninja','Manaphy','Radiant Charizard',
    'Hisuian Heavy Ball','Radiant Alakazam','Genesect V',
  ].sort((a,b)=>a.localeCompare(b)),

  supporter: [
    "Boss's Orders","N","Iono","Professor's Research","Arven","Marnie","Cynthia",
    "Lillie's Determination","Judge","Lysandre","Roxanne","Penny","Crispin","Carmine",
    "Lacey","Janine's Secret Art","Hop","Mustard","Mela","Irida","Klara","Avery",
    "Drayton","Colress's Experiment","Raihan","Melony","Sidney","Phoebe",
    "Bede","Sonia","Leon","Gloria","Nessa","Bea","Allister","Rose",
    "Oleana","Sordward","Shielbert","Peony","Peonia","Avery","Klara",
  ].sort((a,b)=>a.localeCompare(b)),

  item: [
    'Ultra Ball','Nest Ball','Rare Candy','Switch','Counter Catcher','Earthen Vessel',
    'Buddy-Buddy Poffin',"Hero's Cape",'Maximum Belt','Night Stretcher','Air Balloon',
    'Forest Seal Stone','Technical Machine: Evolution','Energy Search','Pal Pad',
    'Great Ball','Level Ball','Quick Ball','Battle VIP Pass','Trekking Shoes',
    'Lost Vacuum','Super Rod','Energy Retrieval','Rescue Board','Hyper Potion',
    'Big Charm','Ordinary Rod','Evolution Incense','Scoop Up Net',
    'Crushing Hammer','Escape Rope','Rope','Rotom Phone','Pokégear 3.0',
    'Capacious Bucket','Galar Mine','Fan of Waves','Telescopic Sight',
    'Choice Helmet','Adventurer\'s Discovery','Cross Switcher','Exp. Share',
  ].sort((a,b)=>a.localeCompare(b)),

  stadium: [
    'Risky Ruins','Artazon','Area Zero Underdepths','Town Hall',
    'Temple of Sword and Shield','Path to the Peak','PokeStop','Power Plant',
    'Lost City','Beach Court','Collapsed Stadium','Training Court',
    'Stormwatch','Magma Basin','Raihan\'s Ballpark','Jubilife Village',
    'Grand Tree Arena','Slippery Slope','Cave of Trials',
  ].sort((a,b)=>a.localeCompare(b)),

  tool: [
    'Bravery Charm','Vitality Band','Choice Belt','Float Stone',
    'Defiance Band','Unfair Stamp','Protective Cape','Gold Potion',
    'Muscle Band','Rocky Helmet','Assault Vest','Expert Belt',
    'Stealthy Hood','Metal Goggles','Telescopic Sight','Fire Crystal',
  ].sort((a,b)=>a.localeCompare(b)),

  energy: [
    'Grass Energy','Fire Energy','Water Energy','Lightning Energy',
    'Psychic Energy','Fighting Energy','Darkness Energy','Metal Energy',
    'Fairy Energy','Dragon Energy','Colorless Energy',
    'Double Turbo Energy','Mist Energy','Jet Energy','Luminous Energy',
    'Stone Fighting Energy','Reversal Energy','Counter Gain',
    'Speed Lightning Energy','Coating Metal Energy','Heat Fire Energy',
    'Powerful Colorless Energy','Gift Energy','Capture Energy',
    'Wash Water Energy','Aromatic Grass Energy',
  ],
};

export const CATEGORY_LABELS = {
  pokemon:   '⚡ Pokemon',
  supporter: '👤 Supporter',
  item:      '🎒 Item',
  stadium:   '🏟️ Stadium',
  tool:      '🔧 Tool',
  energy:    '💎 Energy',
};

export const CATEGORY_LABELS_SHORT = {
  pokemon:   'Pokemon',
  supporter: 'Supporter',
  item:      'Item',
  stadium:   'Stadium',
  tool:      'Tool',
  energy:    'Energy',
};

export const CATEGORY_COLORS = {
  pokemon:   '#ffcb05',
  supporter: '#3b82f6',
  item:      '#22c55e',
  stadium:   '#a855f7',
  tool:      '#f97316',
  energy:    '#ef4444',
};

// Emoji per type Pokemon
export const TYPE_EMOJI = {
  fire: '🔥', water: '💧', grass: '🌿', lightning: '⚡',
  psychic: '🔮', fighting: '🥊', darkness: '🌑', metal: '⚙️',
  dragon: '🐉', fairy: '✨', colorless: '⭐',
};

// Emoji dekorasi komunitas
export const DECO = ['🃏','🏆','⚡','🔥','💫','🌟','🎯','🛡️','👑','🎪','🌈','🎮'];
