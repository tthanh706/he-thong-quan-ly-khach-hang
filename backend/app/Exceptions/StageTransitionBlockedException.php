<?php

namespace App\Exceptions;

use Symfony\Component\HttpKernel\Exception\HttpException;

/**
 * Exception thrown when a stage transition is blocked
 * due to unmet conditions.
 */
class StageTransitionBlockedException extends HttpException
{
    /**
     * @var array<array{condition_id: int, condition_type: string, error_message: string}>
     */
    private array $failedConditions;

    /**
     * @param string $message
     * @param array<array{condition_id: int, condition_type: string, error_message: string}> $failedConditions
     */
    public function __construct(string $message, array $failedConditions = [])
    {
        $this->failedConditions = $failedConditions;
        parent::__construct(422, $message);
    }

    /**
     * @return array<array{condition_id: int, condition_type: string, error_message: string}>
     */
    public function getFailedConditions(): array
    {
        return $this->failedConditions;
    }

    /**
     * Render the exception as an HTTP response.
     */
    public function render(): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'message'           => $this->getMessage(),
            'blocked'           => true,
            'failed_conditions' => $this->failedConditions,
        ], 422);
    }
}
