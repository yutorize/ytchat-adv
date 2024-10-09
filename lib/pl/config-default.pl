################# デフォルト設定 #################
use strict;
use utf8;

package set;

# ここはデフォルト設定です。
# 変更したい場合はここを直接書き換えなず、config.cgiにコピーしてから値を変えてください。

## ●ホームURL
our $home_url = '';

## ●ログ削除パスワード
our $password = '';

## ●過去ログ保存ディレクトリ
our $logs_dir = './logs/';

## ●過去ログファイル名
our $logname_id_add = 1;

## ●過去ログ一覧にログタイトルを表示する
our $list_log_name_view = 1;

## ●BCDice-APIのURL（SWとDX以外を遊ぶ場合は必須です）
our $bcdice_api = '';

## ●ゲームルーム設定
our $userroom_on = 0;
our $userroom_max = 0;

## ●ゲームルーム一覧
our %rooms = ();

## ●ゲームごとの設定
our %games = (
  'sw2' => {
    'name' => 'ソードワールド2.x',
    'status' => ['HP','MP','防護'],
    'bcdice' => 'SwordWorld2.5',
    'faces' => 6,
  },
  'dx3' => {
    'name' => 'ダブルクロス3rd',
    'status' => ['HP','侵蝕','ロイス','財産','行動'],
    'bcdice' => 'DoubleCross',
    'faces' => 10,
  },
);

our $default_game = 'sw2';


## ●ランダムテーブル：「n＠＊＊＊」でtxtファイルの内容からランダムにチョイスできるようにする
our %random_table = (
  'じゃんけん' => { 'data'=>'janken.txt', 'max'=>1, 'def'=>1, 'help'=>'グー、チョキ、パーをランダムに表示します' },
  'トランプ' => { 'data'=>'trump.txt', 'help'=>'全53枚のトランプのカードです' },
  'トランプ2' => { 'data'=>'trump-wjoker.txt', 'help'=>'全54枚のトランプのカードです（ジョーカー2枚）' },
  '大アルカナ' => { 'data'=>'major-arcana.txt', 'faces' => ['正位置','逆位置'], 'help'=>'全21枚のタロットカード（大アルカナ）です' },
  'バニッシュ/フィアー表' => { 'data'=>'sw2-banish-fear.txt', 'help'=>'SW2.5のバニッシュ／フィアー表です' },
);
our $rtable_dir = './rtable/';

## ●テキスト置換定義
our %replace_rule = (
  '[魔]' => '<img alt="[魔]" class="icon" src="./lib/img/icon/sw-wp-magic.png">',
  '[刃]' => '<img alt="[刃]" class="icon" src="./lib/img/icon/sw-wp-edge.png">',
  '[打]' => '<img alt="[打]" class="icon" src="./lib/img/icon/sw-wp-blow.png">',
);

## ●テキスト置換定義（正規表現）
our @replace_regex = (
  { '[|｜](.+?)《(.*?)》' => '<ruby>$1<rt>$2</ruby>' }, #なろうルビ
  { '《《(.+?)》》' => '<em>$1</em>' }, #カクヨム傍点
  { '\{\{(.+?)\}\}' => '<span class="hide">$1</span>' },
  { "'''(.+?)'''" => '<i>$1</i>' },
  { "''(.+?)''" => '<b>$1</b>' },
  { '%%(.+?)%%' => '<s>$1</s>' },
  { '__(.+?)__' => '<u>$1</u>' },
  { '(^|\n)----+(\n|$)' => '<hr>' },
  { '(^|\n)\*{6}(.+?)(\n|$)' => '<h6>$2</h6>' },
  { '(^|\n)\*{5}(.+?)(\n|$)' => '<h5>$2</h5>' },
  { '(^|\n)\*{4}(.+?)(\n|$)' => '<h4>$2</h4>' },
  { '(^|\n)\*{3}(.+?)(\n|$)' => '<h3>$2</h3>' },
  { '(^|\n)\*{2}(.+?)(\n|$)' => '<h2>$2</h2>' },
  { '(^|\n)\*{1}(.+?)(\n|$)' => '<h1>$2</h1>' },
  
  { '\[([○◯〇]|常時?)\]' => '<i class="s-icon passive"><i>[常]</i></i>' },
  { '\[([△]|準備?|備)\]' => '<i class="s-icon setup"><i>[準]</i></i>' },
  { '\[([＞▶〆]|主(動作)?)\]' => '<i class="s-icon major"><i>[主]</i></i>' },
  { '\[([☆≫»]|>>|補(助(動作)?)?)\]' => '<i class="s-icon minor"><i>[補]</i></i>' },
  { '\[([□☑🗨]|宣言?)\]' => '<i class="s-icon active"><i>[宣]</i></i>' },
);

## ●追加した置き換えをヘルプに乗せたい場合
our @replace_help = (
  ['｜テキスト《てきすと》','<ruby>テキスト<rt>てきすと</rt></ruby>','ルビ（ふりがな）を振る'],
  ['《《テキスト》》', '<em>テキスト</em>','傍点を振る'],
  ["''テキスト''"    , '<b>テキスト</b>','太字にする'],
  ["'''テキスト'''"  , '<i>テキスト</i>','斜体にする'],
  ['%%テキスト%%'    , '<s>テキスト</s>','打消線を引く'],
  ['__テキスト__'    , '<u>テキスト</u>','下線を引く'],
  ['{{テキスト}}'    , '<span class="hide">テキスト</span>','文字を透明にする。<br>（ドラッグで選択状態にすると見える）'],
  ['----'            , '<hr>','四つ以上のハイフンで水平線'],
  ['*テキスト'     , '<h1>テキスト</h1>','見出しレベル1'],
  ['**テキスト'    , '<h2>テキスト</h2>','見出しレベル2'],
  ['***テキスト'   , '<h3>テキスト</h3>','見出しレベル3'],
  ['****テキスト'  , '<h4>テキスト</h4>','見出しレベル4'],
  ['*****テキスト' , '<h5>テキスト</h5>','見出しレベル5'],
  ['******テキスト', '<h6>テキスト</h6>','見出しレベル6'],
);

## ●ツールチップ
our %tooltips = (
  'ゆとチャadv\.' => "現在使用中のバージョン：$::ver",
);

## ●背景画像・BGM再生に使用してよいURLを制限
our $src_url_limit = 0;
## 制限する場合の許可URL一覧
our @src_url_list = (
  '',
  '',
  'xxx.yyyy.zzz.com', #例
);

## ●背景画像のプリセット
our @bg_preset = (
  ['https://gakaisozai.up.seesaa.net/01247252N000000000/BG00a1_80.jpg',
   '空（昼）／(C)きまぐれアフター',
  ],
  ['https://gakaisozai.up.seesaa.net/01247252N000000001/134747150552113113690_BG10a_1280.jpg',
   '森の道(昼)／(C)きまぐれアフター',
  ],
);
our $bg_thum_on = 1; #サムネイルの表示

## ●BGMのプリセット
our @bgm_preset = (
  ['',
   'タイトル／(c)権利者名', 80],
  ['',
   '', 80],
);

## ●カスタムCSSファイルのURL
our $custom_css = '';

## ●チャットSE一覧
our @chat_se_list = (
  ['./lib/sound/se-lab/cursor1.mp3',        'カーソル移動1／効果音ラボ', 'chat'],
  ['./lib/sound/se-lab/cursor2.mp3',        'カーソル移動2／効果音ラボ'],
  ['./lib/sound/se-lab/cursor6.mp3',        'カーソル移動6／効果音ラボ'],
  ['./lib/sound/se-lab/cursor9.mp3',        'カーソル移動9／効果音ラボ'],
  ['./lib/sound/se-lab/decision2.mp3',      '決定2／効果音ラボ'],
  ['./lib/sound/se-lab/decision50.mp3',     '決定50／効果音ラボ'],
  ['./lib/sound/se-lab/warning1.mp3',       '警告1／効果音ラボ'],
  ['./lib/sound/kurage-kosho/button01.mp3', 'ボタン01／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button02.mp3', 'ボタン02／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button07.mp3', 'ボタン07／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button08.mp3', 'ボタン08／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button16.mp3', 'ボタン16／くらげ工匠'],
  ['./lib/sound/kurage-kosho/button19.mp3', 'ボタン19／くらげ工匠', 'mark'],
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
  ['./lib/sound/kurage-kosho/one01.mp3', 'フレーズ001／くらげ工匠'],
  ['./lib/sound/kurage-kosho/one04.mp3', 'フレーズ004／くらげ工匠', 'ready'],
  ['./lib/sound/se-lab/decision4.mp3',   '決定4／効果音ラボ'],
);

## ●発言の送信モード
 # Base64にして送信するかどうか
 #（ロリポップなどでファイアウォールに引っ掛かる場合、「1」（=ON）にする）
  our $base64mode = 0;

1;