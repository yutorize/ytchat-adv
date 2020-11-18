################# デフォルト設定 #################
use strict;
use utf8;

package set;

our $password = '';

our $logs_dir = './logs/';

our %rooms = ();

our %games = (
  'sw2' => {
    'name' => 'ソードワールド2.x',
    'status' => ['HP','MP','防護'],
    'convert' => {
      'HP'   => ['hpTotal', 'hpTotal'],
      'MP'   => ['mpTotal', 'mpTotal'],
      '防護' => ['defenseTotalAllDef'],
    },
    'bcdice' => 'SwordWorld2.5',
  },
  'dx3' => {
    'name' => 'ダブルクロス3rd',
    'status' => ['HP','侵蝕','ロイス','財産','行動'],
    'convert' => {
      'HP'     => ['maxHpTotal', 'maxHpTotal'],
      '侵蝕'   => ['baseEncroach'],
      'ロイス' => ['loisHave','loisMax'],
      '財産'   => ['savingTotal'],
      '行動'   => ['initiativeTotal'],
    },
    'bcdice' => 'DoubleCross',
  },
);

our $default_game = 'sw2';

our @replace_regex = (
  { '[|｜](.+?)《(.*?)》' => '<ruby>$1<rp>(</rp><rt>$2</rt><rp>)</rp></ruby>' }, #なろうルビ
  { '《《(.+?)》》' => '<em>$1</em>' }, #カクヨム傍点
  { '\{\{(.+?)\}\}' => '<span class="hide">$1</span>' },
  { "'''(.+?)'''" => '<i>$1</i>' },
  { "''(.+?)''" => '<b>$1</b>' },
  { '%%(.+?)%%' => '<s>$1</s>' },
  { '__(.+?)__' => '<u>$1</u>' },
  { '(^|\n)----+(\n|$)' => '<hr>' },
);

our @replace_help = (
  ['｜テキスト《てきすと》','<ruby>テキスト<rt>てきすと</rt></ruby>','ルビ（ふりがな）を振る'],
  ['《《テキスト》》','<em>テキスト</em>','傍点を振る'],
  ["''テキスト''",  '<b>テキスト</b>','太字にする'],
  ["'''テキスト'''",'<i>テキスト</i>','斜体にする'],
  ['%%テキスト%%',  '<s>テキスト</s>','打消線を引く'],
  ['__テキスト__',  '<u>テキスト</u>','下線を引く'],
  ['{{テキスト}}','<span class="hide">テキスト</span>','文字を透明にする。<br>（ドラッグで選択状態にすると見える）'],
  ['----',  '<hr>','四つ以上のハイフンで水平線'],
);

our @chat_se_list = (
  ['./lib/sound/se-lab/cursor1.mp3',        'カーソル移動1／効果音ラボ'],
  ['./lib/sound/se-lab/warning1.mp3',       '警告1／効果音ラボ'],
  ['./lib/sound/kurage-kosho/button01.mp3', 'ボタン01／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button02.mp3', 'ボタン02／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button07.mp3', 'ボタン07／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button08.mp3', 'ボタン08／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button16.mp3', 'ボタン16／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button19.mp3', 'ボタン19／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button20.mp3', 'ボタン20／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button21.mp3', 'ボタン21／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button31.mp3', 'ボタン31／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button32.mp3', 'ボタン32／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button40.mp3', 'ボタン40／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button41.mp3', 'ボタン41／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button45.mp3', 'ボタン45／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button46.mp3', 'ボタン46／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button50.mp3', 'ボタン50／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button57.mp3', 'ボタン57／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button58.mp3', 'ボタン58／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button63.mp3', 'ボタン63／くらげ工匠'],
);

our @ready_se_list = (
  ['./lib/sound/se-lab/decision4.mp3',   '決定4／効果音ラボ'],
  ['./lib/sound/kurage-kosho/one01.mp3', 'フレーズ001／くらげ工匠'],
  ['./lib/sound/kurage-kosho/one04.mp3', 'フレーズ004／くらげ工匠'],
);

1;