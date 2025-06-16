<?php

namespace App\Http\Controllers;

use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Auth\Access\AuthorizationException;
use OpenApi\Annotations as OA;

/**
 * @OA\Tag(
 *     name="Articles",
 *     description="API Endpoints for Managing Articles"
 * )
 */
class ArticleController extends Controller
{
    /**
     * Store a newly created article in storage.
     * @OA\Post(
     *      path="/api/articles",
     *      operationId="storeArticle",
     *      tags={"Articles"},
     *      summary="Create a new article",
     *      description="Creates a new article for the authenticated user.",
     *      security={{"sanctum":{}}},
     *      @OA\RequestBody(
     *          required=true,
     *          description="Article data",
     *          @OA\JsonContent(
     *              required={"title","category","content"},
     *              @OA\Property(property="title", type="string", example="My First Article"),
     *              @OA\Property(property="category", type="string", example="Technology"),
     *              @OA\Property(property="content", type="string", example="This is the content of my first article."),
     *              @OA\Property(property="link_picture", type="string", format="url", nullable=true, example="http://example.com/article_image.jpg"),
     *              @OA\Property(property="status", type="string", enum={"draft", "published", "archived"}, example="draft")
     *          )
     *      ),
     *      @OA\Response(
     *          response=201,
     *          description="Article created successfully",
     *          @OA\JsonContent(ref="#/components/schemas/Article")
     *      ),
     *      @OA\Response(
     *          response=422,
     *          description="Validation error"
     *      ),
     *      @OA\Response(response=401, description="Unauthenticated")
     * )
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'content' => 'required|string',
            'link_picture' => 'nullable|string|url|max:255', // Assuming it should be a URL
            'status' => 'sometimes|string|in:draft,published,archived', // Example statuses
        ]);

        // Get the authenticated user
        $user = Auth::user();

        // Create the article and associate it with the user
        $article = $user->articles()->create([
            'title' => $validatedData['title'],
            'category' => $validatedData['category'],
            'content' => $validatedData['content'],
            'link_picture' => $validatedData['link_picture'] ?? null,
            'status' => $validatedData['status'] ?? 'draft', // Default to 'draft' if not provided
        ]);

        return response()->json($article, 201); // 201 Created status
    }

    /**
     * Display a listing of the articles.
     * @OA\Get(
     *      path="/api/articles",
     *      operationId="getArticlesList",
     *      tags={"Articles"},
     *      summary="Get list of articles",
     *      description="Returns a list of articles, optionally paginated.",
     *      @OA\Parameter(
     *          name="page",
     *          in="query",
     *          description="Page number for pagination",
     *          required=false,
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(
     *              type="array",
     *              @OA\Items(ref="#/components/schemas/Article")
     *          )
     *      )
     * )
     */
    public function index()
    {
        // You can add pagination here, e.g., Article::paginate(15)
        $articles = Article::with('author')->latest()->get(); // Eager load author relationship
        return response()->json($articles);
    }

    /**
     * Display the specified article.
     * @OA\Get(
     *      path="/api/articles/{id}",
     *      operationId="getArticleById",
     *      tags={"Articles"},
     *      summary="Get article information",
     *      description="Returns article data.",
     *      @OA\Parameter(
     *          name="id",
     *          description="Article ID",
     *          required=true,
     *          in="path",
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Successful operation",
     *          @OA\JsonContent(ref="#/components/schemas/Article")
     *      ),
     *      @OA\Response(
     *          response=404,
     *          description="Article not found"
     *      )
     * )
     */
    public function show(Article $article)
    {
        // Eager load the author relationship if not already loaded by route model binding
        return response()->json($article->load('author'));
    }

    /**
     * Update the specified article in storage.
     * @OA\Put(
     *      path="/api/articles/{id}",
     *      operationId="updateArticle",
     *      tags={"Articles"},
     *      summary="Update an existing article",
     *      description="Updates an existing article. Only the author can update their article.",
     *      security={{"sanctum":{}}},
     *      @OA\Parameter(
     *          name="id",
     *          description="Article ID",
     *          required=true,
     *          in="path",
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\RequestBody(
     *          required=true,
     *          description="Article data to update",
     *          @OA\JsonContent(
     *              required={"title","category","content"},
     *              @OA\Property(property="title", type="string", example="Updated Article Title"),
     *              @OA\Property(property="category", type="string", example="General"),
     *              @OA\Property(property="content", type="string", example="This is the updated content."),
     *              @OA\Property(property="link_picture", type="string", format="url", nullable=true, example="http://example.com/updated_image.jpg"),
     *              @OA\Property(property="status", type="string", enum={"draft", "published", "archived"}, example="published")
     *          )
     *      ),
     *      @OA\Response(
     *          response=200,
     *          description="Article updated successfully",
     *          @OA\JsonContent(ref="#/components/schemas/Article")
     *      ),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=403, description="Forbidden (not the author)"),
     *      @OA\Response(response=404, description="Article not found"),
     *      @OA\Response(response=422, description="Validation error")
     * )
     */
    public function update(Request $request, Article $article)
    {
        if (Auth::id() !== $article->user_id) {
            throw new AuthorizationException('You are not authorized to update this article.');
        }

        $validatedData = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'category' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'link_picture' => 'nullable|string|url|max:255',
            'status' => 'sometimes|string|in:draft,published,archived',
        ]);

        $article->update($validatedData);

        return response()->json($article);
    }

    /**
     * Remove the specified article from storage.
     * @OA\Delete(
     *      path="/api/articles/{id}",
     *      operationId="deleteArticle",
     *      tags={"Articles"},
     *      summary="Delete an article",
     *      description="Deletes an article. Only the author can delete their article.",
     *      security={{"sanctum":{}}},
     *      @OA\Parameter(
     *          name="id",
     *          description="Article ID",
     *          required=true,
     *          in="path",
     *          @OA\Schema(type="integer")
     *      ),
     *      @OA\Response(response=204, description="Article deleted successfully"),
     *      @OA\Response(response=401, description="Unauthenticated"),
     *      @OA\Response(response=403, description="Forbidden (not the author)"),
     *      @OA\Response(response=404, description="Article not found")
     * )
     */
    public function destroy(Article $article)
    {
        if (Auth::id() !== $article->user_id) {
            throw new AuthorizationException('You are not authorized to delete this article.');
        }

        $article->delete();

        return response()->json(null, 204); // 204 No Content
    }
}
