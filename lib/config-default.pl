################# デフォルト設定 #################
use strict;
use utf8;

package set;

our $password = '1234';

our $logs_dir = './logs/';

our %rooms = (
  'stellar'  => { 'name' => '試作', 'game' => 'sw2', 'tab' => 'メイン,サブ' },
  'test-1111' => { 'name' => '試作1111', 'game' => 'sw2', 'tab' => 'メイン,サブ' },
);

our %games = (
  'sw2' => {
    'name' => 'ソードワールド2.x',
    'status' => ['HP','MP','防護'],
  },
  'dx3' => {
    'name' => 'ダブルクロス3rd',
    'status' => ['HP','侵食','行動'],
  },
);

1;