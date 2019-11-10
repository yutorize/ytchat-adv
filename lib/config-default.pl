################# デフォルト設定 #################
use strict;
use utf8;

package set;

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

our %rooms = (
  'test-0504' => { 'name' => '試作0504', 'game' => 'sw2', 'tab' => 'メイン,サブ' },
  'test-1108' => { 'name' => '試作1108', 'game' => 'sw2', 'tab' => 'メイン,サブ' },
  'test-1111' => { 'name' => '試作1111', 'game' => 'sw2', 'tab' => 'メイン,サブ' },
);

1;