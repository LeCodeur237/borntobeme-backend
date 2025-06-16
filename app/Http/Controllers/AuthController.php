<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use OpenApi\Annotations as OA;

/**
 * @OA\Info(
 *      version="1.0.0",
 *      title="BornToMe API Documentation",
 *      description="API documentation for the BornToMe application",
 *      @OA\Contact(
 *          email="admin@borntobeme.com"
 *      ),
 *      @OA\License(
 *          name="Apache 2.0",
 *          url="http://www.apache.org/licenses/LICENSE-2.0.html"
 *      )
 * )
 *
 * @OA\Server(
 *      url=L5_SWAGGER_CONST_HOST,
 *      description="BornToMe API Server"
 * )
 *
 * @OA\Tag(
 *     name="Authentication",
 *     description="API Endpoints for User Authentication"
 * )
 */
class AuthController extends Controller
{
    /**
     * Handle user registration.
     * @OA\Post(
     *      path="/api/register",
     *      operationId="registerUser",
     *      tags={"Authentication"},
     *      summary="Register a new user",
     *      description="Registers a new user and returns the user and an API token.",
     *      @OA\RequestBody(
     *          required=true,
     *          description="User registration data",
     *          @OA\JsonContent(
     *              required={"fullname","email","datebirthday","gender","role","password","password_confirmation"},
     *              @OA\Property(property="fullname", type="string", example="John Doe"),
     *              @OA\Property(property="email", type="string", format="email", example="john.doe@example.com"),
     *              @OA\Property(property="datebirthday", type="string", format="date", example="1990-01-01"),
     *              @OA\Property(property="gender", type="string", example="male"),
     *              @OA\Property(property="linkphoto", type="string", nullable=true, example="http://example.com/photo.jpg"),
     *              @OA\Property(property="role", type="string", example="user"),
     *              @OA\Property(property="password", type="string", format="password", example="password123"),
     *              @OA\Property(property="password_confirmation", type="string", format="password", example="password123")
     *          )
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="User registered successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="user", type="object", ref="#/components/schemas/User"),
     *              @OA\Property(property="token", type="string", example="1|abcdef123456")
     *          )
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Validation error",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="The given data was invalid."),
     *              @OA\Property(property="errors", type="object")
     *          )
     *      )
     * )
     */
    public function register(Request $request)
    {
        // Validate the incoming request data
        $request->validate([
            'fullname' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'datebirthday' => ['required', 'date'],
            'gender' => ['required', 'string', 'max:255'], // Assuming gender is required based on migration
            'linkphoto' => ['nullable', 'string', 'max:255'], // Assuming linkphoto is optional
            'role' => ['required', 'string', 'max:255'], // Assuming role is required
            'password' => ['required', 'string', 'min:8', 'confirmed'], // 'confirmed' requires password_confirmation field
        ]);

        // Create the user
        $user = User::create([
            'fullname' => $request->fullname,
            'email' => $request->email,
            'datebirthday' => $request->datebirthday,
            'gender' => $request->gender,
            'linkphoto' => $request->linkphoto,
            'role' => $request->role,
            'password' => Hash::make($request->password), // Password hashing is handled by the model cast, but explicit is also fine
        ]);

        // Create a Sanctum token for the user
        $token = $user->createToken('api_token')->plainTextToken;

        // Return the user and token
        return response()->json([
            'user' => $user,
            'token' => $token,
        ], 201); // 201 Created status code
    }

    /**
     * Handle user login.
     * @OA\Post(
     *      path="/api/login",
     *      operationId="loginUser",
     *      tags={"Authentication"},
     *      summary="Login an existing user",
     *      description="Logs in an existing user and returns the user and an API token.",
     *      @OA\RequestBody(
     *          required=true,
     *          description="User login data",
     *          @OA\JsonContent(
     *              required={"email","password"},
     *              @OA\Property(property="email", type="string", format="email", example="john.doe@example.com"),
     *              @OA\Property(property="password", type="string", format="password", example="password123")
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="User logged in successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="user", type="object", ref="#/components/schemas/User"),
     *              @OA\Property(property="token", type="string", example="2|abcdef123456")
     *          )
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Validation error or Invalid credentials",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="The given data was invalid."),
     *              @OA\Property(property="errors", type="object")
     *          )
     *      )
     * )
     */
    public function login(Request $request)
    {
        // Validate the incoming request data
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Attempt to authenticate the user
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')], // Use Laravel's built-in auth failed message
            ]);
        }

        // Create a Sanctum token for the authenticated user
        $token = $user->createToken('api_token')->plainTextToken;

        // Return the user and token
        return response()->json(['user' => $user, 'token' => $token]);
    }

    /**
     * Get the authenticated user.
     * @OA\Get(
     *      path="/api/user",
     *      operationId="getAuthenticatedUser",
     *      tags={"Authentication"},
     *      summary="Get the authenticated user",
     *      description="Returns the currently authenticated user's data.",
     *      security={{"sanctum":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/User")
     *      ),
     *      @OA\Response(
     *          response=401,
     *          description="Unauthenticated",
     *      )
     * )
     */
    public function authenticatedUser(Request $request)
    {
        return $request->user();
    }

    /**
     * Handle user logout.
     * @OA\Post(
     *      path="/api/logout",
     *      operationId="logoutUser",
     *      tags={"Authentication"},
     *      summary="Logout the authenticated user",
     *      description="Logs out the current user by revoking their API token.",
     *      security={{"sanctum":{}}},
     *      @OA\Response(
     *          response=200,
     *          description="Logged out successfully",
     *          @OA\JsonContent(
     *              @OA\Property(property="message", type="string", example="Logged out successfully")
     *          )
     *      ),
     *      @OA\Response(
     *          response=401,
     *          description="Unauthenticated",
     *      )
     * )
     */
    public function logout(Request $request)
    {
        // Revoke the current user's token
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }
}
