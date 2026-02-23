<?php
// Test puertos alternativos
$tests = [
    ['smtp.gmail.com', 2525],
    ['sandbox.smtp.mailtrap.io', 2525],
    ['sandbox.smtp.mailtrap.io', 587],
    ['smtp-relay.brevo.com', 587],
];
foreach ($tests as [$host, $port]) {
    $c = @fsockopen($host, $port, $errno, $errstr, 5);
    echo "$host:$port => " . ($c ? "OK" : "BLOQUEADO") . "\n";
    if ($c) fclose($c);
}
