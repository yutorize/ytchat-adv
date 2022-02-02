use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";

###################
### ダブルクロス

sub dxRoll {
  my $comm = shift;
  if($comm !~ /^
        ( [0-9\+\-\*\/()]+ | \([0-9\+\-\*\/()]+\) )                                #ダイス数
        (?:r|dx)
    (?: ( [0-9]+ | \([0-9\+\-\*\/()]+\) ) )?                                       #C値（疾風怒濤式）
    (?: ([\+\-][0-9\+\-\*\/()]+) )?                                                #修正値
    (?: @([0-9\+\-\*\/()]+) | @\(([0-9\+\-\*\/()]+)\) | \[([0-9\+\-\*\/()]+)\] )?  #C値 @／@()／[]
    (?: (>=) ([0-9\+\-\*()]*) )?                                                   #目標値
    (?:\s|$)
  /ix){
    return "";
  }
  my $quant = $1;
  my $crit  = $2 ? $2
            : $4 ? $4
            : $5 ? $5
            : $6;
  my $form  = $3;
  my $rel    = $7;
  my $target = $8;
  
  $quant = int(calc($quant));
  $crit  = int(calc($crit));
  if($form){
    $form = parenthesisCalc($form);
    if($form eq ''){ return ''; }
  }
  
  $quant = $quant > 200 ? 200 : $quant; # 振る数は200まで
  $crit = $crit ? $crit : 10;
  
  my $code = "判定値${quant} C値${crit}";
  my @results;
  my $total = 0;
  while ($quant) {
    my $max = 0;  #振った中での最大値
    my $next = 0; #次に振る個数
    my @numbers;
    foreach my $i (1..$quant) {
      my $number = int(rand(10)) + 1;
      push(@numbers, $number);
      if($number > $max) { $max = $number; }
      if($number >= $crit){ $max = 10; $next++; }
    }
    $total += $max;
    $quant = $next;
    @numbers = sort { $a <=> $b } @numbers;
    if($quant){ push(@results, " ${max}\[".join(',',@numbers).":クリティカル!\] "); }
    else      { push(@results, " ${max}\[".join(',',@numbers)."\] "); }
    
    if($total == 1){ return "${code} → $results[0] ファンブル.. = 0".($rel?' → 失敗':''); }
    elsif($crit < 2){ return "${code} → $results[0] ... = ∞".($rel?' → 成功':''); }
  }
  my $result = join('+', @results);
  $total  += int(calc($form));
  $result .= "${form} = ${total}";
  if($rel){
    if($rel eq '>=' && $total >= $target){
      $result .= ' → 成功';
    }
    else { $result .= ' → 失敗'; }
    $code .= ' '.$rel.$target;
  }

  return $code .' → '. $result;
}

sub encroachRoll {
  my $rolls = shift;
  my $minus = shift;
  $rolls = $rolls < 1 ? 1 : $rolls > 10 ? 10 : $rolls;
  my $number = 0; my @numbers;
  foreach(1 .. $rolls){
    my $n = int(rand(10)) + 1;
    $number += $n;
    push(@numbers, $n);
  }
  my ($result, $system) = ( unitCalcEdit($::in{'name'}, '侵蝕'.($minus?'-':'+').$number) );
  $result = "${rolls}D10 → ".join(',',@numbers)."　$result";
  return ($result, $system);
}

sub resurrectRoll {
  my $rolls = shift;
  my $plus  = shift;
  $rolls = $rolls < 1 ? 1 : $rolls > 10 ? 10 : $rolls;
  my $number = 0;
  foreach(1 .. $rolls){ $number += int(rand(10)) + 1; }
  my $result_hp = ( unitCalcEdit($::in{'name'}, 'HP'.($plus?'+':'=').$number) )[0];
  my $over = 0;
  if($result_hp =~ /over([0-9]+)/){ $over = $1; }
  
  my ($result_en, $system) = ( unitCalcEdit($::in{'name'}, '侵蝕+'.($number-$over)) );
  my$result = "${rolls}D10 → ${number}　$result_hp　$result_en";
  return ($result, $system);
}

sub emotionRoll {
  my $type = shift;
  my $result = "感情表${type} → ";
  my $c = int(rand(2));
  if(!$type || $type eq 'P'){ $result .= ( $c && !$type ? '✔':'').emotionPositive(); }
  if(!$type){ $result .= ' ／ '; }
  if(!$type || $type eq 'N'){ $result .= (!$c && !$type ? '✔':'').emotionNegative(); }
  
  return $result;
}

sub emotionPositive {
  my @line = (
    '好奇心','憧憬','尊敬','連帯感','慈愛','感服','純愛','友情','慕情','同情',
    '遺志','庇護','幸福感','信頼','執着','親近感','誠意','好意','有為','尽力',
  );
  return $line[rand @line];
}
sub emotionNegative {
  my @line = (
    '食傷','脅威','嫉妬','悔悟','恐怖','不安','劣等感','疎外感','恥辱','憐憫',
    '偏愛','憎悪','隔意','嫌悪','猜疑心','厭気','不信感','不快感','憤懣','敵愾心',
  );
  return $line[rand @line];
}

## FS判定：ハプニングチャート http://www.fear.co.jp/dbx3rd/
sub hcRoll {
  my @line = (
    'こともなし。修正は特にない。',
    '専門的知識が必要。そのラウンドの間、指定された技能が4レベル以下のキャラクターが獲得する進行値は-1となる（最低0）。',
    '焦り。そのラウンド中、難易度+1D10。',
    '一歩間違えば致命的な状況。次の進行判定に失敗した場合、今まで獲得した進行度が0になる。',
    '異常な興奮。そのラウンド中、進行判定に失敗したキャラクターは暴走を受ける。',
    'プレッシャー。そのラウンド中に進行判定を行ったキャラクターは、判定の直後に重圧を受ける。',
    '幸運がほほえむ。このラウンド中に行う進行判定はすべてクリティカル値-1される。',
    '破滅的不運。このラウンド中、進行判定はすべてクリティカル値+1される。',
    '一か八かのチャンス。このラウンド中、最大達成値と難易度に+10。',
    '膠着した進行。修正は特にない。',
    '綱渡りのような状況。このラウンド中、難易度+1D10。',
    'あるかなきかのチャンス。このラウンド中、最大達成値+10。',
    '消耗を伴う作業。このラウンド中に進行判定を行ったキャラクターは、判定の直後に1D10点のHPダメージを受ける。',
    'チャンス到来。このラウンド中に行う進行判定は、ダイスが+5個される。',
    '予想外のピンチ。このラウンド中に行う進行判定は、ダイスが-5個される。',
    '緊張がレネゲイドを活性化。そのラウンド中に進行判定を行ったキャラクターは、判定の直後に1D10点侵蝕率が増加。',
    '突破口の発見。このシーン中の最大達成値+10。この効果は重複しない。',
    '事態の断続的な悪化。このシーン中の難易度+1D10。この効果は重複する。',
    '順当な進行。このラウンド中に進行判定に成功したキャラクターは、進行度を+1得る。',
  );
  return 'ハプニングチャート → '.$line[rand @line];
}


1;