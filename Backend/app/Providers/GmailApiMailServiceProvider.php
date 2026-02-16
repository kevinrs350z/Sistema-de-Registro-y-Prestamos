<?php

namespace App\Providers;

use App\Mail\Transport\GmailApiTransport;
use Illuminate\Mail\MailManager;
use Illuminate\Support\ServiceProvider;

class GmailApiMailServiceProvider extends ServiceProvider
{
    public function register()
    {
        //
    }

    public function boot()
    {
        $this->app->afterResolving(MailManager::class, function (MailManager $manager) {
            $manager->extend('gmail-api', function (array $config) {
                return new GmailApiTransport(
                    $config['client_id']     ?? config('services.google.client_id'),
                    $config['client_secret'] ?? config('services.google.client_secret'),
                    $config['refresh_token'] ?? config('services.gmail.refresh_token'),
                );
            });
        });
    }
}
