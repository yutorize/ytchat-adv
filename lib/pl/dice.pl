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
  $comm =~ tr/ａ-ｚＡ-Ｚ０-９＋－＊／＾＠＄＃（）＜＞、＝！：/a-zA-Z0-9\+\-\*\/\^@\$#\(\)<>,=!:/;
  if   ($comm =~ /^[0-9\+\-\*\/()]*[0-9]+\)?D\(?([0-9\+\-]|\s|$)/i){ return diceRoll($comm), 'dice'; }
  elsif($comm =~ /^[0-9]*@/){ return shuffleRoll($comm), 'choice'; }
  elsif($comm =~ /^[0-9]*\$/){ return choiceRoll($comm), 'choice'; }
  # 四則演算
  elsif($comm =~ /^
    ( \(? \-? [0-9]+ [\+\-\/*\^]
      [0-9\+\-\/*\^()]*
      [0-9] \)? )
    [=＝](?:\s|$)
    /ix){
    my $formula = $1;
    if($formula !~ /[\+\-\/\*\^]/) { return ''; }
    if($formula =~ m|//|) { return ''; }
    my $formula_perl = $formula;
    $formula =~ s#\^#\*\*#g;
    $formula_perl =~ s#\*\*#\^#g;
    my $result = eval($formula);
    if($result eq ''){ return ''; }
    return "${formula_perl} = ${result}", 'dice';
  }
  # SW2
  elsif($::in{'game'} eq 'sw2'){
    if   ($comm =~ /^([rk]|威力)[0-9()a-zァ-ヴ]/i){ require './lib/pl/dice/sw2.pl'; return rateRoll($comm), 'dice:sw'; }
    elsif($comm =~ /^(gr|成長ダイス)/i)           { require './lib/pl/dice/sw2.pl'; return growRoll($comm), 'dice:sw'; }
  }
  # DX3
  elsif($::in{'game'} eq 'dx3'){
    if   ($comm =~ /^ET(P|N)?(?:\s|$)/i)      { require './lib/pl/dice/dx3.pl'; return emotionRoll($1), 'dice:dx'; }
    elsif($comm =~ /^HC(?:\s|$)/i)            { require './lib/pl/dice/dx3.pl'; return hcRoll(), 'dice:dx'; }
    elsif($comm =~ /^ER([0-9]*)(?:\s|$)/i)    { require './lib/pl/dice/dx3.pl'; return encroachRoll($1); }
    elsif($comm =~ /^RE([0-9]*)(?:\s|$)/i)    { require './lib/pl/dice/dx3.pl'; return resurrectRoll($1); }
    elsif($comm =~ /^\+RE([0-9]*)(?:\s|$)/i)  { require './lib/pl/dice/dx3.pl'; return resurrectRoll($1,1); }
    elsif($comm =~ /^[0-9\+\-\*\/()]+(r|dx)/i){ require './lib/pl/dice/dx3.pl'; return dxRoll($comm), 'dice:dx'; }
  }
}

sub diceRoll {
  my $comm = shift;
  if($comm !~ /^
    ( 
      \(?
      [0-9\+\-\*\/()]*
      [0-9]+
      \)?
      D
      [0-9(]*
      [0-9\+\-\*\/()D@]*?
    )
    (?:(\/\/|\*\*) ([0-9]*) ([+-][0-9()][0-9\+\-\*()]*)? )?
    (?:(>=?|<=?|=) ([0-9\+\-\*()]*) )?
    (?:\:([0-9]+))?
    (?:\s|$)
  /ix){
    return "";
  }
  
  my $base      = $1;
  my $half_type = $2;
  my $half_num  = $3;
  my $add       = $4;
  my $rel       = $5;
  my $target    = $6;
  my $repeat    = $7;
  
  $base = parenthesisCalc($base);
  if($base eq ''){ return ''; }
  if($add){
    $add = parenthesisCalc($add);
    if($add eq ''){ return ''; }
  }
  if($target){
    $target = parenthesisCalc($target);
    if($target eq ''){ return ''; }
  }
  
  $repeat = ($repeat > 10) ? 10 : (!$repeat) ? 1 : $repeat;
  my @result;
  foreach my $i (1 .. $repeat){
    push(@result,
      diceCalc(
        $base      ,
        $half_type ,
        $half_num  ,
        $add       ,
        $rel       ,
        $target    ,
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
  my $rel       = shift;
  my $target    = shift;
  
  my $total = 0;
  my @code;
  # xDyを処理
  while ($base =~ s/([0-9]+)D([0-9]*)(@[0-9]+)?/<dice>/i){
    my ($code, $num, $text) = dice($1, $2, $3);
    return "$code → error\[$text\]" if $num eq '';
    return "$code → ∞" if $num eq '∞';
    push(@code, $code);
    $base =~ s/<dice>/ $num\[$text\] /;
  }
  $base =~ s/[\.\+\-\*\/\s]+$//gi; # 末尾の演算子は消す
  
  ## 基本合計値計算
  my $result = $base;
  $base =~ s/\[.+?\]//g; # []とその中は消す
  if($base =~ /@/){ return '' }
  my $total = calc($base);
  
  ## 半減,倍化処理
  if(!$half_num){ $half_num = 2 }
  if($half_type =~ /^\/\//){ $result = "{ $result = $total } /$half_num "; $total = ceil($total / $half_num); }
  elsif($half_type =~ /^\*\*/){ $result = "{ $result = $total } *$half_num "; $total = $total * $half_num; }
  ## 半減後追加
  $result .= $add;
  $total += calc($add);
  
  $total = int($total);
  
  if($result =~ /[\+\-\*\/\,]/){ $result .= ' = ' . $total; }
  else { $result = $total; }
  
  my $code = join('+',@code);
  
  if($rel){
    if(
      ($rel eq '>'  && $total >  $target) ||
      ($rel eq '>=' && $total >= $target) ||
      ($rel eq '<'  && $total <  $target) ||
      ($rel eq '<=' && $total <= $target) ||
      ($rel eq '='  && $total == $target)
    ){
      $result .= ' → 成功';
    }
    else { $result .= ' → 失敗'; }
    $code .= $rel.$target;
  }
  
  return $code .' → '. $result;
}

sub dice {
  my $rolls = $_[0];
  my $faces = $_[1];
  my $crit  = $_[2]; $crit =~ s/^@//;
  if($faces eq ''){ $faces = 6 }
  if   ($rolls > 200) { return ("${rolls}D${faces}", '', 'ダイスの個数は200が最大です'); }
  elsif($faces > 1000){ return ("${rolls}D${faces}", '', 'ダイスの面数は1000が最大です'); }
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
    
    my $result = join(',', @results);
    if($rolls && $::in{'game'} =~ /sw2/i){
      $result .= ($rolls*$faces == $num) ? '!!' : ($rolls == $num) ? '...' : '';
    }
    
    push( @full_results, $result);
    
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