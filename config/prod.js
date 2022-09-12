module.exports = {
   google_project_id: process.env.GOOGLE_PROJECT_ID,
   dialogflow_session_id: process.env.DIALOGFLOW_SESSION_ID,
   dialogflow_session_language_code: process.env.DIALOGFLOW_SESSION_LANGUAGE_CODE,
   google_client_email: process.env.GOOGLE_CLIENT_EMAIL,
   google_private_key: JSON.parse(process.env.GOOGLE_PRIVATE_KEY),
   mongo_URI: process.env.MONGODB_URI,
   jwt_secret: process.env.JWT_SECRET,
};
