const { WebhookClient, Payload } = require('dialogflow-fulfillment');
const Course = require('../models/Course');

module.exports = app => {
   app.post('/', async (req, res) => {
      const agent = new WebhookClient({ request: req, response: res });

      console.log('\n intent = ', agent.intent);
      console.log('paramters = ', JSON.stringify(agent.parameters));
      console.log('context = ', JSON.stringify(agent.contexts));
      console.log('messages = ', JSON.stringify(agent.consoleMessages));
      console.log('query = ', agent.query); // user quiery
      console.log('type of query = ', typeof agent.query + '\n');

      // Utilities funcions
      const capitalizeFirstLetter = string => {
         return string.charAt(0).toUpperCase() + string.slice(1);
      };
      const getAandAn = string => {
         const vowels = ['A', 'E', 'I', 'O', 'U', 'a', 'e', 'i', 'o', 'u'];
         return vowels.includes(string.charAt(0)) ? 'an' : 'a';
      };

      // intent funcions handler
      const handleGetName = agent => {
         const userQuery = agent.query;

         // check if contains digit
         if (/\d/.test(userQuery)) {
            agent.add(' ');
            // You cannot have number in your name. Please tell your name again. Thank you 😊.
            // There can't be a number in your name. Please repeat your name for me. Thank you 😊.
            agent.setFollowupEvent('GET_NAME_WITH_NUMBER_FALLBACK');
         } else {
            const payload = {
               quick_replies: [
                  {
                     text: 'Yes',
                     payload: 'n/a',
                  },
                  {
                     payload: 'n/a',
                     text: 'No',
                  },
               ],
            };
            agent.consoleMessages.forEach(message => agent.add(message));
            agent.add(new Payload(agent.UNSPECIFIED, payload, { rawPayload: true, sendAsMessage: true }));
         }
      };

      const handleGetAge = agent => {
         if (agent.parameters.hasOwnProperty('age')) {
            if (agent.parameters.age <= 0) {
               agent.add(' '); // adding dummy text to avoid error -> No responses defined for platform: null
               agent.setFollowupEvent('GET_AGE_LOW_FALLBACK');
            } else if (agent.parameters.age > 200) {
               agent.add(' '); // adding dummy text to avoid error -> No responses defined for platform: null
               agent.setFollowupEvent('GET_AGE_HIGH_FALLBACK');
            } else agent.consoleMessages.forEach(message => agent.add(message));
         } else {
            agent.add(' '); // adding dummy text to avoid error -> No responses defined for platform: null
            agent.setFollowupEvent('GET_AGE_FALLBACK');
         }
      };

      const handleWelcome = agent => {
         // clear riasecContext if exist when intent trigger
         const riasecContext = agent.getContext('riasec');
         if (riasecContext) agent.setContext({ name: riasecContext.name, lifespan: 0 });
         agent.consoleMessages.forEach(message => agent.add(message));
      };

      const handleRiasecStart = agent => {
         // remove basic-info contenxt
         const basicInfoContext = agent.getContext('basic-info');
         if (basicInfoContext) agent.setContext({ name: basicInfoContext.name, lifespan: 0 });
         agent.consoleMessages.forEach(message => agent.add(message));
      };

      const handleFallbackExceedTriggerLimit = agent => {
         const contexts = agent.contexts;

         // clear all context by setting lifespan to zero (0)
         contexts.forEach(context => {
            agent.setContext({ name: context.name, lifespan: 0 });
         });

         agent.consoleMessages.forEach(message => agent.add(message));
      };

      const handleRiasecRecommendation = async agent => {
         // context based on the event name - ex : sample_recommend, which contains paramaters sent from front end
         // the parameter  passsed  from front-end to dialogflow will be avaiable in the context
         // the agent.parameters is empty because the paramaters passed is in the context
         // dialogflow automatically create context based on the event name which contains the context you passed from front-end
         // dialogflow does not store the context passed from front-end to agent.parameters instead in the agent.context

         const context = agent.contexts.filter(el => el.name === 'riasec_recommendation'); // get the specific context
         const parameters = context[0].parameters;

         console.log(parameters['0'][0], ' = ', parameters['0'][1]);
         console.log(parameters['1'][0], ' = ', parameters['1'][1]);
         console.log(parameters['2'][0], ' = ', parameters['2'][1]);

         if (!parameters['0'][1] && !parameters['1'][1] && !parameters['2'][1]) {
            // student does not have any interest among those questions whtih riasec scores is all zero (0)
            agent.add(
               `It looks like you didn't have any interest in the things that I had asked you. 
                Unfortunately 😓, because of that, I can't recommend you any degree programs at the moment. 
                Instead, I can show you my recommendation based on your senior high school strand 😊.`
            );
            // trigger intent to show recommendation based on strand
         } else {
            // if riasec scores are not all zero
            const riasecAreas = {
               realistic: 'who are often good at mechanical or athletic jobs.',
               investigative: 'who like to watch, learn, analyze and solve problems.',
               artistic: 'like to work in unstructured situations where you can use your creativity.',
               social: 'who like to work with other people, rather than things.',
               enterprising: 'who like to work with others and enjoy persuading and and performing.',
               conventional: 'who are very detail oriented, organized and like to work with data.',
            };

            const riasecAreasIdentify = `
            Now. I already know the things you are interested in. You are ${getAandAn(parameters['0'][0])} “${capitalizeFirstLetter(
               parameters['0'][0]
            )}”, “${capitalizeFirstLetter(parameters['1'][0])}” and “${capitalizeFirstLetter(parameters['2'][0])}” person.`;

            const riasecAreasDescription = `
            You’re ${getAandAn(parameters['0'][0])} "${capitalizeFirstLetter(parameters['0'][0])}" person ${riasecAreas[parameters['0'][0]]} 
            You’re also ${getAandAn(parameters['1'][0])} "${capitalizeFirstLetter(parameters['1'][0])}" person, ${riasecAreas[parameters['1'][0]]} 
            Lastly, I found out that your are ${getAandAn(parameters['2'][0])} "${capitalizeFirstLetter(parameters['2'][0])}" person, ${
               riasecAreas[parameters['2'][0]]
            }`;

            const riasec1 = parameters['0'][0].toUpperCase(); // highest score riasec area
            const riasec2 = parameters['1'][0].toUpperCase(); // second or same with higest
            const riasec3 = parameters['2'][0].toUpperCase(); // third or same with higest
            const toFilterCourse = [parameters['0'][0].toUpperCase()];
            const payload = { basis: 'riasec' };

            console.log('\n1.', riasec1);
            console.log('2.', riasec2);
            console.log('3.', riasec3);

            // Add into the toFilterCourse the riasec area that is euqal to the highest score riasec area
            // value of toFilterCourse are the riasec area
            if (parameters['0'][1] === parameters['1'][1]) toFilterCourse.push(riasec2);
            if (parameters['0'][1] === parameters['2'][1]) toFilterCourse.push(riasec3);

            console.log('filterObject = ', toFilterCourse);

            // fetch courses or degree program based on toFilterCourse
            try {
               const riasecBasedRecommendedCourses = await Course.find({ riasec_area: { $in: toFilterCourse } }).sort({ name: 'asc' });
               const riasecBasedRecommendedCoursesNames = riasecBasedRecommendedCourses.map(course => course.name);
               payload.riasec_recommended_courses = riasecBasedRecommendedCoursesNames;
            } catch (err) {
               console.error(err.message);
            }

            agent.add(riasecAreasIdentify);
            agent.add(riasecAreasDescription);
            agent.add(new Payload(agent.UNSPECIFIED, payload, { rawPayload: true, sendAsMessage: true })); // passed custom payload
         }
      };

      const handleStrandRecommendation = async agent => {
         const context = agent.contexts.filter(el => el.name === 'strand_recommendation'); // get the specific context
         const parameters = context[0].parameters;
         const toFilterStrand = [parameters['strand'].toUpperCase()];
         const payload = { basis: 'strand' };

         console.log('toFilterStrand = ', toFilterStrand);

         try {
            const strandBasedRecommendedCourses = await Course.find({ strand: { $in: toFilterStrand } }).sort({ name: 'asc' });
            const strandBasedRecommendedCoursesNames = strandBasedRecommendedCourses.map(course => course.name);
            console.log('strandBasedRecommendedCourses = ', strandBasedRecommendedCourses);
            payload.strand_recommended_courses = strandBasedRecommendedCoursesNames;
         } catch (err) {
            console.error(err.message);
         }

         agent.add(new Payload(agent.UNSPECIFIED, payload, { rawPayload: true, sendAsMessage: true })); // passed custom payload
      };

      const handleGetRiasecRecommendationCourseInfo = async agent => {
         const context = agent.contexts.filter(el => el.name === 'get_riasec_recommendation_course_info'); // get the specific context
         const parameters = context[0].parameters;
         const courseToLookup = parameters.course_to_lookup;

         try {
            const course = await Course.findOne({ name: courseToLookup });
            if (course) {
               const payload = {
                  quick_replies: [
                     {
                        text: 'I am satisfied',
                        payload: 'ISWANT_STRAND_RECOMMENDATION',
                     },
                     {
                        text: "I'd like to know other degree programs",
                        payload: 'ISLEARN_RIASEC_RECOMMENDED_COURSES_YES',
                     },
                  ],
               };

               agent.add(course.description);
               agent.add(new Payload(agent.UNSPECIFIED, payload, { rawPayload: true, sendAsMessage: true }));
            } else {
               agent.add(' ');
               agent.setFollowupEvent('ISLEARN_RIASEC_RECOMMENDED_COURSES_YES');
            }
         } catch (error) {
            agent.add('Sorry. I am having trouble 🤕. I was unable to look up the degree programs information at the moment.');
         }
      };

      const handleGetStrandRecommendationCourseInfo = async agent => {
         const context = agent.contexts.filter(el => el.name === 'get_strand_recommendation_course_info'); // get the specific context
         const parameters = context[0].parameters;
         const courseToLookup = parameters.course_to_lookup;

         try {
            const course = await Course.findOne({ name: courseToLookup });
            if (course) {
               const payload = {
                  quick_replies: [
                     {
                        text: 'I am satisfied',
                        payload: 'END_CONVERSATION', // temporary value
                     },
                     {
                        text: "I'd like to know other degree programs",
                        payload: 'ISLEARN_STRAND_RECOMMENDED_COURSES_YES',
                     },
                  ],
               };

               console.log(course);
               agent.add(course.description);
               agent.add(new Payload(agent.UNSPECIFIED, payload, { rawPayload: true, sendAsMessage: true }));
            } else {
               agent.add(' ');
               agent.setFollowupEvent('ISLEARN_STRAND_RECOMMENDED_COURSES_YES');
            }
         } catch (error) {
            agent.add('Sorry. I am having trouble 🤕. I was unable to look up the degree programs information at the moment.');
         }
      };

      const checkUncertainty = agent => {
         // idea: assign this function to question-qustion-<number>-yes question-qustion-<number>-no question-qustion-<number>-fallback
         // idea: to check if their answer is cotains uncertain words or dont have idea then trigger intent for uncertain then set the context same as fallback to go back
         // idea: assign by iterating/looping 42 times, assign intent names dynamically using number

         const userQuery = agent.query;
         const texts = ['i dont know', "i don't know", 'maybe', 'perhaps', 'probably', 'might be'];

         let isUnsure = false;
         for (let i = 0; i < texts.length; i++) {
            if (userQuery.includes(texts[i])) {
               isUnsure = true;
               break;
            }
         }

         if (isUnsure) agent.add('You are unsure of what you said. Can please provide me an answer that you are sure and not being uncertain.');
         else agent.consoleMessages.forEach(message => agent.add(message));
      };

      // intents that has fulfillment enable
      // set IntentMap with intent name and a intent function handler to run for that intent
      let intentMap = new Map();
      intentMap.set('Default Welcome Intent', handleWelcome);
      intentMap.set('get-name', handleGetName);
      intentMap.set('get-age', handleGetAge);
      intentMap.set('riasec-start', handleRiasecStart);
      intentMap.set('riasec-recommendation', handleRiasecRecommendation);
      intentMap.set('strand-recommendation', handleStrandRecommendation);
      intentMap.set('fallback-exceed-trigger-limit', handleFallbackExceedTriggerLimit);
      intentMap.set('get-riasec-recommendation-course-info', handleGetRiasecRecommendationCourseInfo);
      intentMap.set('get-strand-recommendation-course-info', handleGetStrandRecommendationCourseInfo);

      // intentMap.set('riasec-start-fallback', checkUncertainty);
      agent.handleRequest(intentMap);
   });
};
