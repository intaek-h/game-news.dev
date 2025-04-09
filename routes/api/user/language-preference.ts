// filepath: /Users/ahiou/Documents/repositories/extinguish-backend/routes/api/user/language-preference.ts
import { Handlers } from "$fresh/server.ts";
import { auth } from "~/auth.ts";
import { setLanguageCookie, updateUserLanguagePreference } from "~/utils/language.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      // Check if user is logged in
      const session = await auth.api.getSession({
        headers: req.headers,
      });

      if (!session || !session.user) {
        return Response.json({ success: false, message: "Unauthorized" }, {
          status: 401,
        });
      }

      // Get language from request body
      const data = await req.json();
      const { languageCode } = data;

      if (!languageCode || typeof languageCode !== "string") {
        return Response.json({
          success: false,
          message: "Invalid language code",
        }, { status: 400 });
      }

      // Update user preference in database
      const success = await updateUserLanguagePreference(
        session.user.id,
        languageCode,
      );

      if (!success) {
        return Response.json({
          success: false,
          message: "Failed to update preference",
        }, { status: 500 });
      }

      // Set cookie with new language preference
      const cookie = setLanguageCookie(languageCode);

      return Response.json(
        { success: true, message: "Language preference updated" },
        {
          status: 200,
          headers: {
            "Set-Cookie": cookie,
          },
        },
      );
    } catch (error) {
      console.error("Error updating language preference:", error);
      return Response.json(
        { success: false, message: "Failed to update preference" },
        { status: 500 },
      );
    }
  },
};
