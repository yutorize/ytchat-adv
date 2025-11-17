use strict;
use utf8;

package StateTemplate;

our @stateTemplates = (
    {
        'gameName' => 'SW2.5',
        'categories' => [
          {
            'categoryName' => '汎用',
            'states' => [
              {'name' => '転倒', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => '起き上がるまで', 'description' => '行動判定－２\n起き上がった後も手番中は継続'},
              {'name' => '全力移動', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => '1R', 'description' => '回避力判定－４', 'source' => '#self'},
              {'name' => '離脱準備', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => '1R', 'description' => '回避力判定－４', 'source' => '#self'},
              {'name' => '行為判定＋１', 'icon' => {'category' => '汎用', 'direction' => 'buff'}, 'duration' => undef},
              {'name' => '行為判定＋２', 'icon' => {'category' => '汎用', 'direction' => 'buff'}, 'duration' => undef},
              {'name' => '行為判定－１', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '行為判定－２', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '行為判定－４', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '行動判定＋１', 'icon' => {'category' => '汎用', 'direction' => 'buff'}, 'duration' => undef},
              {'name' => '行動判定＋２', 'icon' => {'category' => '汎用', 'direction' => 'buff'}, 'duration' => undef},
              {'name' => '行動判定－１', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '行動判定－２', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '行動判定－４', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
            ],
          },
          {
            'categoryName' => 'リスク',
            'states' => [
              {'name' => 'リスク／回避力判定－２', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => '1R', 'source' => '#self'},
              {'name' => 'リスク／回避力判定－１', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => '1R', 'source' => '#self'},
              {'name' => 'リスク／抵抗力判定－２', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => '1R', 'description' => '生命・精神抵抗力判定－２', 'source' => '#self'},
            ],
          },
          {
            'categoryName' => '真語魔法',
            'states' => [
              {'name' => '【ブラント・ウェポン】', 'icon' => {'category' => 'SW2/真語魔法', 'direction' => 'debuff'}, 'duration' => '18R', 'description' => '近接攻撃・遠隔攻撃の物理ダメージ－４'},
              {'name' => '【バイタリティ】', 'icon' => {'category' => 'SW2/真語魔法', 'direction' => 'buff'}, 'duration' => '18R', 'description' => '生命抵抗力判定＋２'},
            ],
          },
          {
            'categoryName' => '操霊魔法',
            'states' => [
              {'name' => '【ファナティシズム】', 'icon' => {'category' => 'SW2/操霊魔法', 'direction' => 'other'}, 'duration' => '18R', 'description' => '命中力判定＋２、回避力判定－２\n精神効果'},
            ],
          },
          {
            'categoryName' => '魔動機術',
            'states' => [
              {'name' => '【ターゲットサイト】', 'icon' => {'category' => 'SW2/魔動機術', 'direction' => 'buff'}, 'duration' => '1R', 'description' => '命中力判定＋１', 'source' => '#self'},
            ],
          },
          {
            'categoryName' => '練技',
            'states' => [
              {'name' => '【シェイプアニマル】', 'icon' => {'category' => 'SW2/練技', 'direction' => 'buff'}, 'duration' => '60分', 'description' => '動物に変身する', 'source' => '#self'},
            ],
          },
          {
            'categoryName' => '賦術',
            'states' => [
              {'name' => '【ヴォーパルウェポン】Ｂ', 'icon' => {'category' => 'SW2/賦術', 'direction' => 'buff'}, 'duration' => '18R', 'description' => '与える物理ダメージ＋１'},
              {'name' => '【ヴォーパルウェポン】Ａ', 'icon' => {'category' => 'SW2/賦術', 'direction' => 'buff'}, 'duration' => '18R', 'description' => '与える物理ダメージ＋２'},
              {'name' => '【ヴォーパルウェポン】Ｓ', 'icon' => {'category' => 'SW2/賦術', 'direction' => 'buff'}, 'duration' => '18R', 'description' => '与える物理ダメージ＋３'},
              {'name' => '【ヴォーパルウェポン】SS', 'icon' => {'category' => 'SW2/賦術', 'direction' => 'buff'}, 'duration' => '18R', 'description' => '与える物理ダメージ＋６'},
            ],
          },
          {
            'categoryName' => '鼓咆',
            'states' => [
              {'name' => '【怒涛の攻陣Ⅰ】', 'icon' => {'category' => 'SW2/鼓咆', 'direction' => 'buff'}, 'duration' => '1R', 'description' => '近接・遠隔攻撃の物理ダメージ＋１'},
            ],
          },
          {
            'categoryName' => '戦闘特技',
            'states' => [
              {'name' => '《かいくぐり》回避成功', 'icon' => {'category' => '汎用', 'direction' => 'buff'}, 'duration' => '次ラウンドの攻撃まで', 'description' => '近接攻撃のクリティカル値－１', 'source' => '#self'},
              {'name' => '《インファイトⅠ》', 'icon' => {'category' => '汎用', 'direction' => 'other'}, 'duration' => '1R', 'description' => '特定対象のみ攻撃可能\n命中力判定＋２\n回避力判定－２', 'source' => '#self'},
              {'name' => '《インファイトⅡ》', 'icon' => {'category' => '汎用', 'direction' => 'other'}, 'duration' => '1R', 'description' => '特定対象のみ攻撃可能\n命中力判定＋２、ダメージ＋４\n回避力判定－２', 'source' => '#self'},
            ],
          },
          {
            'categoryName' => '種族特徴',
            'states' => [
              {'name' => '［異貌］', 'icon' => {'category' => '汎用', 'direction' => 'buff'}, 'duration' => '解除まで', 'description' => '魔法行使の一部条件を省略', 'source' => '#self'},
              {'name' => '［異貌］６レベル', 'icon' => {'category' => '汎用', 'direction' => 'buff'}, 'duration' => '解除まで', 'description' => '魔法行使の一部条件を省略\n与えるダメージ＋１', 'source' => '#self'},
              {'name' => '［異貌］11レベル', 'icon' => {'category' => '汎用', 'direction' => 'buff'}, 'duration' => '解除まで', 'description' => '魔法行使の一部条件を省略\n与えるダメージ＋１\n命中力判定、行使判定＋１', 'source' => '#self'},
              {'name' => '［獣変貌］', 'icon' => {'category' => '汎用', 'direction' => 'other'}, 'duration' => '解除まで', 'description' => '筋力ボーナス＋２\nリカント語以外の発声不可', 'source' => '#self'},
              {'name' => '［獣変貌］11レベル', 'icon' => {'category' => '汎用', 'direction' => 'other'}, 'duration' => '解除まで', 'description' => '筋力ボーナス＋２、敏捷度ボーナス＋１\nリカント語以外の発声不可', 'source' => '#self'},
              {'name' => '［剣の加護／風の翼］', 'icon' => {'category' => '汎用', 'direction' => 'buff'}, 'duration' => '1R', 'description' => '近接攻撃の命中力・回避力判定＋１\n全力移動不可', 'source' => '#self'},
              {'name' => '［剣の加護／風の翼］６レベル', 'icon' => {'category' => '汎用', 'direction' => 'buff'}, 'duration' => '1R', 'description' => '近接攻撃の命中力・回避力判定＋１', 'source' => '#self'},
            ],
          },
          {
            'categoryName' => '消耗品',
            'states' => [
              {'name' => '〈デクスタリティポーション〉', 'icon' => {'category' => '汎用', 'direction' => 'buff'}, 'duration' => '3R', 'description' => '命中力判定＋２', 'source' => '#self'},
              {'name' => '〈アンチマジックポーション〉', 'icon' => {'category' => '汎用', 'direction' => 'buff'}, 'duration' => '6R', 'description' => '受ける魔法ダメージ－３', 'source' => '#self'},
              {'name' => '〈熱狂の酒〉', 'icon' => {'category' => '汎用', 'direction' => 'buff'}, 'duration' => '1日', 'description' => '一度だけＨＰへの適用ダメージの一部または全部をＭＰで肩代わりできる', 'source' => '#self'},
            ],
          },
          {
            'categoryName' => '石化進行',
            'states' => [
              {'name' => '石化進行（器用度／－６）', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '石化進行（器用度／－12）', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '石化進行（敏捷度／－６）', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '石化進行（敏捷度／－12）', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '石化進行（筋力／－６）', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '石化進行（筋力／－12）', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '石化進行（生命力／－６）', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '石化進行（生命力／－12）', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '石化進行（知力／－６）', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '石化進行（知力／－12）', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '石化進行（精神力／－６）', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
              {'name' => '石化進行（精神力／－12）', 'icon' => {'category' => '汎用', 'direction' => 'debuff'}, 'duration' => undef},
            ],
          },
        ],
    },
);
