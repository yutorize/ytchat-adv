use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";
use List::Util qw/shuffle/;
use POSIX qw/ceil/;

###################
### ダイス処理


sub diceCheck {
  my $comm = shift;
  
  $comm =~ s/&gt;/>/;
  $comm =~ s/&lt;/</;
  $comm =~ s/<br>/ /;
  $comm =~ tr/ａ-ｚＡ-Ｚ０-９＋－＊／＠＄＃＜＞、＝！：/a-zA-Z0-9\+\-\*\/@\$#<>,=!:/;
  if   ($comm =~ /^[0-9\+\-\*]*[0-9]+D([0-9]|\s|$)/i){ return diceRoll($comm), 'dice'; }
  elsif($comm =~ /^[0-9]*@/){ return shuffleRoll($comm), 'choice'; }
  elsif($comm =~ /^[0-9]*\$/){ return choiceRoll($comm), 'choice'; }
  elsif($::in{'game'} eq 'sw2' && $comm =~ /^[rk][0-9()]/i) { require './lib/pl/dice/sw2.pl'; return rateRoll($comm), 'dice:sw'; }
  elsif($::in{'game'} eq 'sw2' && $comm =~ /^gr(\s|$)/i)    { require './lib/pl/dice/sw2.pl'; return growRoll($comm), 'dice:sw'; }
  elsif($::in{'game'} eq 'dx3' && $comm =~ /^[0-9]+(r|dx)/i)    { require './lib/pl/dice/dx3.pl'; return   dxRoll($comm), 'dice:dx'; }
  elsif($::in{'game'} eq 'dx3' && $comm =~ /^ET(P|N)?(?:\s|$)/i){ require './lib/pl/dice/dx3.pl'; return emotionRoll($1), 'dice:dx'; }
  elsif($::in{'game'} eq 'dx3' && $comm =~ /^HC(?:\s|$)/i)      { require './lib/pl/dice/dx3.pl'; return        hcRoll(), 'dice:dx'; }
}

sub diceRoll {
  my $comm = shift;
  if($comm !~ /^
    ( [0-9\+\-\*]*[0-9]+ D [0-9]*[0-9\+\-\*D@]*?)
    (?:(\/\/|\*\*)([0-9]*)([+-][0-9][0-9\+\-\*]*)?)?
    (?:\:([0-9]+))?
    (?:\s|$)
  /ix){
    return "";
  }
  my $base = $1;
  my $half_type = $2;
  my $half_num  = $3;
  my $add  = $4;
  my $repeat = $5;
  
  $repeat = ($repeat > 10) ? 10 : (!$repeat) ? 1 : $repeat;
  my @result;
  foreach my $i (1 .. $repeat){
    push(@result,
      diceCalc(
        $base      ,
        $half_type ,
        $half_num  ,
        $add       ,
      )
    );
  }
  return join('<br>',@result);
}
sub diceCalc {
  my $base      = shift;
  my $half_type = shift;
  my $half_num  = shift;
  my $add       = shift;
  
  my $total = 0;
  my @code;
  # xDyを処理
  while ($base =~ s/([0-9]+)D([0-9]*)(@[0-9]+)?/<dice>/i){
    my ($code, $num, $text) = dice($1, $2, $3);
    return "$code → error\[$text\]" if !$num;
    return "$code → ∞" if $num eq '∞';
    push(@code, $code);
    $base =~ s/<dice>/ $num\[$text\] /;
  }
  $base =~ s/[\.\+\-\*\/\s]+$//gi; # 末尾の演算子は消す
  
  ## 基本合計値計算
  my $result = $base;
  $base =~ s/\[.+?\]//g; # []とその中は消す
  my $total = calc($base);
  
  ## 半減,倍化処理
  if(!$half_num){ $half_num = 2 }
  if($half_type =~ /^\/\//){ $result = "{ $result = $total } /$half_num "; $total = ceil($total / $half_num); }
  elsif($half_type =~ /^\*\*/){ $result = "{ $result = $total } *$half_num "; $total = $total * $half_num; }
  ## 半減後追加
  $result .= $add;
  $total += calc($add);
  
  if($result =~ /[\+\-\*\,]/){ $result .= ' = '; }
  else { $result = ''; }
  return join('+',@code) .' → '. $result . $total;
}
sub dice {
  my $rolls = $_[0];
  my $faces = $_[1];
  my $crit  = $_[2]; $crit =~ s/^@//;
  if($faces eq ''){ $faces = 6 }
  if   ($rolls < 1 || $rolls > 200) { return ("${rolls}D${faces}", 0, 'ダイスの個数は200が最大です'); }
  elsif($faces < 2 || $faces > 1000){ return ("${rolls}D${faces}", 0, 'ダイスの面数は1000が最大です'); }
  elsif($crit ne '' && $crit  <= $rolls){ return ("${rolls}D${faces}\@${crit}", '∞'); }
  
  my $num_total;
  my @full_results;
  foreach (my $i = 0; $i < 100; $i++) {
    my $num;
    my @results;
    foreach (1 .. $rolls){
      my $number = int(rand $faces) + 1;
      push(@results, $number);
    } 
    $num += $_ foreach @results;
    $num_total += $num;
    
    push( @full_results, (join(',', @results)) );
    
    last if !$crit;
    last if $num < $crit;
  }
  my $text = join('][', @full_results);
  
  return "${rolls}D${faces}".($crit?"\@${crit}":''), $num_total, $text;
}

sub shuffleRoll {
  my $comm = shift;
  if($comm !~ s/^
    ([0-9]+)? @ (.*?)
    (?:\s|$)
  //ix){
    return;
  }
  my $rolls = $1; my $rolls_raw = $rolls;
  my $faces = $2;
  my $max = $set::random_table{$faces} ? $set::random_table{$faces}{'max'} : 10;
  my $def = $set::random_table{$faces} ? $set::random_table{$faces}{'def'} : 1;
     $rolls = $rolls > $max ? $max
            : !$rolls ? $def
            : $rolls;
  if($set::random_table{$faces}) {
    open(my $FH, '<', "${set::rtable_dir}/$set::random_table{$faces}{'data'}") or error($set::random_table{$2}.'が開けません');
    my @list = <$FH>;
    close($FH);
    @list = shuffle(@list);
    my @choice = @list[0 .. $rolls-1];
    chomp $_ foreach (@choice);
    return "${rolls}\@${faces} → [".join('][', @choice)."]";
  }
  else {
    $faces =~ s/>/&gt;/;
    $faces =~ s/</&lt;/;
    my @list = split(/[,、]/, $faces);
    return "" if (@list <= 1 || (!$rolls_raw)); #誤爆防止
    @list = shuffle(@list);
    my @choice = splice(@list, 0, $rolls);
    return '<b>【✔:'.join(',', @choice).'】</b> <s>［×:'.join(',', @list).'］</s>';
  }
  return "";
}

sub choiceRoll {
  my $comm = shift;
  if($comm !~ /^
    ([0-9]+)? \$ (.*?)
    (?:\s|$)
  /ix){
    return "";
  }
  my $rolls = $1; my $rolls_raw = $rolls;
  my $faces = $2;
  my $max = $set::random_table{$faces} ? $set::random_table{$faces}{'max'} : 10;
  my $def = $set::random_table{$faces} ? $set::random_table{$faces}{'def'} : 1;
     $rolls = $rolls > $max ? $max
            : !$rolls ? $def
            : $rolls;
  if($set::random_table{$faces}) {
    open(my $FH, '<', "${set::rtable_dir}/$set::random_table{$faces}{'data'}") or error($set::random_table{$2}.'が開けません');
    my @list = <$FH>;
    close($FH);
    my @choice;
    foreach (1 .. $rolls){
      push(@choice, $list[rand(@list)]);
    }
    chomp $_ foreach (@choice);
    return "${rolls}\$${faces} → [".join('][', @choice)."]";
  }
  else {
    $faces =~ s/>/&gt;/;
    $faces =~ s/</&lt;/;
    my @list = split(/[,、]/, $faces);
    return "" if (@list <= 1 || (!$rolls_raw)); #誤爆防止

    my @results;
    foreach (1 .. $rolls){
      push(@results, $list[rand(@list)]);
    }
    return "(${faces}) → <b>".join(',', @results).'</b>';
  }
  return "";
}

1;