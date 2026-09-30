<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Trong test, nhieu request dung chung mot app instance nen guard Sanctum se
     * giu lai user cua request truoc. Xoa guard truoc moi request de moi request
     * duoc xac thuc lai bang token cua chinh no (giong moi truong thuc te).
     */
    public function call($method, $uri, $parameters = [], $cookies = [], $files = [], $server = [], $content = null)
    {
        $this->app->make('auth')->forgetGuards();

        return parent::call($method, $uri, $parameters, $cookies, $files, $server, $content);
    }
}
