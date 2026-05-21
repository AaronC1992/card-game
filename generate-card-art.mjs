/**
 * Card Art Generator - Filthy Minded Battle Deck
 * Downloads AI-generated art for all 110 cards from Pollinations.ai (free, no API key).
 * Run with: node generate-card-art.mjs
 * Skips files that already exist. Resumes safely if interrupted.
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'public', 'assets', 'cards');

// Art style suffix appended to every prompt
const STYLE = 'dark neon trading card game illustration, deep black background, neon glow lighting, vibrant neon colors, detailed painterly digital art, dramatic lighting, no text, no watermark, no card frame, square composition';

// Map of filename (without .png) -> descriptive art prompt
const CARDS = {
  // ── CREATURES ─────────────────────────────────────────────────────────────
  'passive-aggressaurus':
    'passive-aggressive T-rex dinosaur in business casual office attire, tie and name badge, holding coffee mug with sullen disappointed expression, fluorescent office cubicle background',
  'wine-goblin':
    'small green goblin creature wearing a purple headscarf, grinning mischievously while drinking from a large wine glass, surrounded by wine bottles and candles',
  'doomscroll-drake':
    'dark sleek dragon curled around a glowing smartphone, scales with neon circuit patterns, eyes reflect bad news phone screen with notification alerts, cyan glow',
  'trash-panda-executive':
    'raccoon in a sharp business suit and tie, confident executive stance, surrounded by chaotic office paperwork and sticky notes, office background',
  'overshare-oracle':
    'mysterious fortune teller woman with glowing crystal ball, purple mystical candles, speech bubbles overflowing with overshared secrets and trauma dumps',
  'coupon-demon':
    'small red devil creature clutching a massive stack of coupons and scissors, manic triumphant grin, shopping bags and Sale signs behind it',
  'reply-all-raptor':
    'velociraptor in business office attire typing furiously on a keyboard, email envelopes exploding through the air, office cubicle background',
  'ghost-zone-ghoul':
    'translucent ghostly figure floating mid-air staring at a phone showing read receipts ignored, sad haunted expression, purple spectral glow',
  'brunch-basilisk':
    'elegant serpentine basilisk wearing oversized glamorous sunglasses, holding a champagne flute, marble brunch table with avocado toast, fabulous energy',
  'notification-nightmare':
    'shadowy creature made entirely from glowing red notification badges and alert bubbles, overwhelmed with incoming alerts, monstrous digital horror form',
  'side-hustle-salamander':
    'salamander lizard in a delivery uniform, juggling multiple package boxes and hustle materials, surrounded by cardboard boxes and products',
  'anxiety-apparition':
    'translucent ghostly apparition with a swirling anxious vortex face, surrounded by floating catastrophic thought clouds and worst-case scenario visions, purple mind energy',
  'karmatic-koala':
    'wise silver-glowing koala with cosmic energy aura, floating serenely, surrounded by swirling complaint papers and karmic scales, neutral all-knowing expression',
  'deadline-demon':
    'powerful horned corporate demon in a burning business suit, holding a flaming torn calendar, legendary dark fire energy, office hellscape background',
  'fomo-phantom':
    'translucent phantom pressing its face against multiple glowing phone screens showing parties and events, desperate envious expression, cyan digital glow',
  'subscription-specter':
    'ghostly specter formed from coiling subscription receipt paper, dragging chains made of auto-renewal charges, haunting a cartoon wallet, green consumer horror',
  'cringe-cryptid':
    'blurry sasquatch-like cryptid creature clutching a phone displaying old embarrassing social media posts, hands covering face in shame, chaotic found-footage energy',
  'budget-warlock':
    'sinister warlock wearing price tag jewelry and clearance sale robes, holding a discount grimoire, cauldron filled with bargain bin items, green consumer magic glow',
  'gaslamp-golem':
    'towering golem constructed from layers of gaslighting text and rewritten memories, reality distortion aura warping the space around it, deep purple mind energy',
  'algorithm-ape':
    'cybernetic ape with glowing data stream tattoos on its body, one eye replaced by a social media targeting reticle, viral trending energy radiating from it',
  'wrath-raccoon':
    'furious raccoon standing in a ring of overturned trash cans and garbage, clutching a strongly worded note, neon pink rage aura blazing',
  'microwave-mutant':
    'horrifying humanoid mutant with a microwave oven for a head, toxic green smell waves visible from reheated fish, fluorescent office kitchen background',
  'clout-chimera':
    'legendary three-headed chimera, each head filming the others with smartphones, follower count numbers floating above, neon blue legendary epic glow, massive scale',
  'regret-wraith':
    'legendary ethereal wraith composed of 3AM shame spirals and past bad decisions, floating cringe memories and regrets orbiting it, deep purple legendary darkness',

  // ── ACTION CARDS ──────────────────────────────────────────────────────────
  'hr-summons':
    'ominous official HR Department summons letter glowing with menacing red legal energy, formal seal stamped in blood red, dread energy radiating outward from the document',
  'petty-receipt':
    'long shopping receipt being held up triumphantly as damning evidence, certain line highlighted in neon yellow, glowing vindication energy',
  'emergency-group-chat':
    'phone screen exploding with a chaotic group chat full of fire emojis and all-caps messages, notification chaos erupting outward',
  'retail-therapy-bag':
    'luxurious shopping bag radiating healing golden light and sparkles, consumer therapy healing energy, magical glow',
  'side-hustle-energy-drink':
    'garish energy drink can covered in hustle slogans and grindset motivational text, electrical sparks and lightning bolts crackling around it',
  'block-unseen':
    'phone screen showing a clean block confirmation with shield energy, blue digital protection barrier forming',
  'stress-leave':
    'glowing doctors note with calming soft green energy, office stress and obligations evaporating away as smoke',
  'unsubscribe-bomb':
    'giant red UNSUBSCRIBE button detonating like a bomb, subscription emails scattering as confetti explosion',
  'unsolicited-advice':
    'overflowing speech bubble packed with unsolicited opinions and asterisked corrections, smug figure delivering it all uninvited',
  'performance-review':
    'corporate performance review document radiating ominous red dread energy, bar charts going steeply down, intimidating office atmosphere',
  'situationship-ending':
    'ambiguous phone text thread ending in chaos, relationship status as an exploding question mark, pink chaos energy burst',
  'inbox-zero-fantasy':
    'pristine empty email inbox bathed in holy white light, peaceful angelic glow, mythical impossible achievement energy',
  'emotional-support-snack':
    'comforting snack food surrounded by warm soft healing light, cozy emotional recovery glow, feel-better energy',
  'vague-posting':
    'cryptic dramatic social media post with no context, everyone replying with question marks and concern, ambiguous chaos energy',
  'passive-aggressive-sticky-note':
    'bright yellow sticky note with a passive aggressive message written in suspiciously cheerful handwriting, subtle menace radiating from it',
  'rock-bottom-clarity':
    'figure standing at the very bottom of a metaphorical pit, sudden breakthrough lightning bolt of clarity striking, rising energy',
  'screaming-into-the-void':
    'silhouetted figure screaming into a dark swirling void portal, cathartic energy release explosion, emotional chaos release',
  'internet-rabbit-hole':
    'glowing rabbit hole made from stacked browser tabs and video thumbnails, spiraling infinitely downward into digital depths',
  'flex-tape-solution':
    'famous grey adhesive tape being confidently applied to something catastrophically falling apart, fix-it energy, bold confidence',
  'life-coach-intervention':
    'intense life coach with glowing motivational aura, vision board floating behind them, overwhelming positivity energy blasting forward',
  'bold-strategy':
    'chess board with pieces arranged in total chaotic nonsense, confident aura despite obvious disaster, bold irrational confidence',
  'the-silent-treatment':
    'person surrounded by absolute deafening silence waves, text messages visible as read but no reply, cold blue silence energy',
  'spite-sprint':
    'figure sprinting at maximum speed powered entirely by pure spite, pink rage energy trailing behind them, determined expression',
  'reclaim-your-time':
    'giant clock with its hands being grabbed and pulled back forcefully, time reclamation energy, personal agency restoration',
  'viral-moment':
    'frozen video frame at peak viral cringe moment, notification explosion rings around it, cyan trending energy',
  'budget-meeting':
    'ominous corporate conference room with red marker crossing out budget line items, decimation energy, financial doom',
  'morning-routine-collapse':
    'chaotic morning with alarm clocks everywhere, coffee spilled, everything going wrong simultaneously, entropy cascade energy',
  'tax-season-panic':
    'towering pile of tax forms glowing with ominous stress energy, calculator sobbing, financial panic energy',
  'emotional-availability-rare':
    'glowing open heart radiating golden warmth, emotional vulnerability shown as a rare legendary power up, warm healing energy',
  'vending-machine-crisis':
    'office vending machine with a product tantalizingly stuck on the edge, mixture of fury and desperate hope energy',
  'soft-launch':
    'barely-started half-finished project being presented with false confidence, hopeful pink energy glow',
  'doomscroll-session':
    'phone glowing in complete darkness as someone scrolls endlessly, haunting blue light horror, information doom energy',
  'cancel-culture-wave':
    'massive digital tidal wave made of cancel icons and callout posts sweeping everything away, social media chaos',
  'family-gathering-escape-plan':
    'detailed emergency tactical escape map with family gathering location marked in red, survival strategy energy',
  'impulse-checkout':
    'online shopping cart exploding with unplanned purchases, one-click buy button pulsing, impulsive consumer energy',
  'hyperfixation-mode':
    'mind laser-focused on a single topic with everything else completely blurred out, tunnel vision obsession glow, hyper energy',
  'shame-spiral-recovery':
    'figure climbing back up out of a deep shame spiral, phoenix-like recovery energy, cringe healing light',
  'conference-call-ambush':
    'unexpected Zoom call notification appearing while person is clearly in pajamas and unready, digital panic energy',
  'caffeine-crash':
    'figure dramatically collapsing after a caffeine high, surrounded by empty energy drink cans, withdrawal energy',
  'no-context-screenshot':
    'single phone screenshot completely weaponized out of context, digital evidence of nothing specific, pink chaos energy',
  'catastrophic-update':
    'software update screen going catastrophically wrong with system errors, digital disaster energy, failure cascade',
  'petty-text-chain':
    'escalating text message chain growing increasingly petty, receipts being dramatically pulled out, petty pink vindication',
  'forbidden-spreadsheet':
    'ominous glowing spreadsheet containing forbidden corporate knowledge, dark data energy, sinister rows and columns',
  'doom-purchase':
    'single catastrophic impulse purchase item glowing with financial horror energy, consumer doom aura',
  'spiral-energy-burst':
    'anxiety spiral erupting as a massive energy explosion, multicolor chaos spiral energy burst radiating outward',
  'clout-transfer':
    'social media clout visibly transferring between two figures, follower counts shifting, digital neon transfer energy',

  // ── ITEM CARDS ────────────────────────────────────────────────────────────
  'do-not-disturb-hoodie':
    'oversized hoodie radiating a powerful DO NOT DISTURB force field, protective antisocial armor energy, introvert shield',
  'participation-trophy':
    'participation trophy glowing with ironic hollow gold light, mediocrity celebration energy, technically-an-achievement aura',
  'stress-ball-of-power':
    'stress ball crackling with electrical stress energy, therapeutic destruction power, squeezing power glow',
  'cursed-lanyard':
    'office lanyard weighed down by too many access badges and dangling items, cursed bureaucratic weight energy',
  'lucky-coffee-cup':
    'worn coffee cup radiating warm lucky morning ritual energy, caffeinated fortune and power glow',
  'ring-light-of-confidence':
    'ring light radiating artificial confidence halo, content creator power energy, manufactured charisma glow',
  'brand-deal-shield':
    'shield assembled from sponsored content logos and brand partnership badges, influencer protection armor, sellout defense',
  'anxiety-weighted-blanket':
    'weighted blanket glowing with soothing calming energy, anxiety-reducing armor, protective comfort cocoon',
  'situational-sunglasses':
    'sunglasses granting situational confidence power, cool energy shield, vibe protection aura when needed',
  'power-bank-of-determination':
    'power bank charging with glowing determination energy, never-quit willpower battery, persistence and resilience glow',
  'grudge-journal':
    'journal overflowing with documented grievances and receipts, grudge preservation energy, petty archive of wrongs',
  'refund-request-badge':
    'official-looking consumer rights badge of authority, demanding refund power energy, rightful resolution force',
  'night-mode-goggles':
    'futuristic goggles with soothing night mode blue light filter, screen addiction protection energy, eye armor',
  'scarcity-mindset-amulet':
    'amulet pulsing with scarcity hoarding energy, limited edition protective power, fear of missing out defense',
  'passive-income-hat':
    'baseball cap with money raining down from it, passive income manifestation energy, hustle royalty crown',
  'caffeine-dependency-crown':
    'regal crown assembled from coffee cups and energy drink cans, caffeinated royalty power, addiction-fueled strength',
  'hyper-focus-lens':
    'single magnifying lens radiating hyper-focus energy, ADHD superpower mode activated, laser tunnel vision power',
  'chaotic-good-cape':
    'flowing cape swirling with chaotic good energy, well-intentioned chaos aura, heroic mayhem alignment',
  'unread-messages-curse':
    'phone displaying 999 plus unread notifications glowing with curse energy, communication overwhelm power',
  'validation-sticker-sheet':
    'colorful sticker sheet of positive affirmation stickers radiating warm validation energy, emotional support item',

  // ── REACTION CARDS ────────────────────────────────────────────────────────
  'actually-though':
    'bold speech bubble radiating ACTUALLY correction energy, counter-argument power surge, debate mode activation',
  'wait-what':
    'dramatic double-take energy visualization, rewinding thought bubble, surprised counter-reaction confusion burst',
  'receipts-ready':
    'digital receipts ready for deployment as irrefutable evidence, vindication energy, proof power activation',
  'plot-twist':
    'dramatic narrative twist reveal explosion, story-flipping energy, unexpected counter move burst',
  'boundary-setting':
    'strong glowing boundary wall materializing, self-respect protective barrier energy, personal boundary power',
  'pivot':
    'sharp business pivot maneuver energy trail, quick direction change glow, adaptability burst',
  'i-read-that-wrong':
    'text message being reinterpreted with new meaning, misunderstanding correction energy, rereading power',
  'guilt-trip-counter':
    'guilt trip projectile being deflected by a shield and bounced back, emotional manipulation counter shield',
  'soft-no':
    'gentle but firm refusal barrier materializing, assertive kind declining energy, soft power boundary',
  'not-my-problem':
    'problem bouncing off a deflector shield back to its sender, detachment energy, not-my-department force field',
  'oops-all-feelings':
    'overwhelming flood of emotions releasing all at once, feeling too much energy explosion, emotional chaos burst',
  'tactical-crying':
    'single dramatically perfect tear falling with tactical precision, strategic emotional deployment, calculated crying power',

  // ── FIELD CARDS ───────────────────────────────────────────────────────────
  'open-floor-plan':
    'vast open office floor plan with no privacy, sound waves bouncing everywhere, corporate productivity theater energy',
  'algorithm-change':
    'massive social media algorithm update wave sweeping through digital space, all previous strategies collapsing, chaos energy',
  'happy-hour-protocol':
    'office happy hour scene with neon bar signs, colleagues loosening ties, after-work chaos energy, drinks flowing',
  'group-chat-emergency':
    'phone group chat notification avalanche, emergency chaos energy, everyone pinging at once, message explosion',
  'scorched-earth-sale':
    'massive clearance sale zone, everything must go energy, consumer scorched earth chaos, extreme discount battlefield',
  'passive-aggressive-memo':
    'corporate memo with passive aggressive office policy energy radiating, everyone quietly seething, professional hostility field',
  'burnout-season':
    'seasonal burnout haze spreading across a workplace, exhaustion energy field, everyone running on empty, burnout fog',
  'chaos-spiral':
    'massive chaos spiral vortex pulling everything into disorder, multicolor chaotic energy swirling, entropy field expanding',
};

// ── Utility: follow redirects and save to disk ───────────────────────────────
function download(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.get(url, { timeout: 60000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
      file.on('error', (err) => { fs.unlink(dest, () => {}); reject(err); });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const entries = Object.entries(CARDS);
  console.log(`Generating art for ${entries.length} cards...\n`);

  let done = 0;
  let skipped = 0;
  let failed = 0;

  for (const [filename, prompt] of entries) {
    const dest = path.join(OUT_DIR, `${filename}.png`);

    if (fs.existsSync(dest)) {
      console.log(`  [skip] ${filename}.png already exists`);
      skipped++;
      continue;
    }

    const fullPrompt = `${prompt}, ${STYLE}`;
    const encoded = encodeURIComponent(fullPrompt);
    const seed = Math.abs(filename.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=512&height=768&seed=${seed}&nologo=true&model=flux`;

    process.stdout.write(`  [${done + skipped + failed + 1}/${entries.length}] ${filename} ... `);

    let attempts = 0;
    let success = false;
    while (attempts < 3 && !success) {
      try {
        await download(url, dest);
        const size = fs.statSync(dest).size;
        if (size < 5000) {
          // Suspiciously small - likely an error response, retry
          fs.unlinkSync(dest);
          throw new Error(`Image too small (${size} bytes)`);
        }
        console.log(`done (${Math.round(size / 1024)}KB)`);
        success = true;
        done++;
      } catch (err) {
        attempts++;
        if (attempts < 3) {
          process.stdout.write(`retry ${attempts}... `);
          await delay(3000);
        } else {
          console.log(`FAILED: ${err.message}`);
          failed++;
          if (fs.existsSync(dest)) fs.unlinkSync(dest);
        }
      }
    }

    // Rate limit: wait between requests
    if (success) await delay(1500);
  }

  console.log(`\nDone! Generated: ${done}, Skipped: ${skipped}, Failed: ${failed}`);
  if (failed > 0) {
    console.log('Re-run the script to retry failed cards.');
  }
}

main().catch(console.error);
