<?php

namespace App\Providers;

use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Event;
use App\Events\PrestamoCreated;
use App\Events\PrestamoActualizado;
use App\Events\SancionCreado;
use App\Events\SancionActualizado;
use App\Listeners\LogPrestamoCreated;
use App\Listeners\LogPrestamoActualizado;
use App\Listeners\LogSancionCreado;
use App\Listeners\LogSancionActualizado;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        PrestamoCreated::class => [
            LogPrestamoCreated::class,
        ],
        PrestamoActualizado::class => [
            LogPrestamoActualizado::class,
        ],
        SancionCreado::class => [
            LogSancionCreado::class,
        ],
        SancionActualizado::class => [
            LogSancionActualizado::class,
        ],
    ];

    /**
     * Register any events for your application.
     *
     * @return void
     */
    public function boot()
    {
        //
    }
}
