use strict;
#use warnings;
use utf8;
use open ":utf8";
use open ":std";

###################
### ダブルクロス

sub dxRoll {
  my $comm = shift;
  if($comm !~ s/^
        ( [0-9\+\-]+ ) (?:r|dx)
    (?: ([0-9]+) )?
    (?: ([\+\-][0-9\+\-]+) )?
    (?: @([0-9\+\-]+) | \[([0-9\+\-]+)\] )?
    (?:\s|$)
  //ix){
    return;
  }
  my $quant = $1;
  my $crit  = ($2 ? $2 : ($4 ? $4 : $5));
  my $form  = $3;
  
  $quant = calc($quant);
  $crit  = calc($crit);
  
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
    
    if($total == 1){ return "${code} → $results[0] ファンブル.. = 0"; }
    elsif($crit < 2){ return "${code} → $results[0] ... = ∞"; }
  }
  my $result = join('+', @results);
  $total  += calc($form);
  $result .= "${form} = ${total}";

  return $code .' → '. $result;
}


1;