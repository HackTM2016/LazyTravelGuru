travelApp.controller('UpdateProfileController', function($scope, WebService){
  const tags = ["seaside", "sunny", "beach", "sand", "summer", "winter", "spring", "autumn", "nature", "sports", "food", "culture",
  "museum", "love", "holiday","snow", "tourism", "cold", "cruise ship",
  "monuments", "rainy", "hot", "cars", "relax", "roadtrip", "ocean", "island", "zoo", "tropical", "safari", "park", "country_side",
  "architecture", "lake", "river", "vulcano", "swimming", "shopping", "history", "clubbing", "music", "motorbike", "games",
  "forest", "jungle", "camping", "luxury", "water_activities", "chill", "adventure", "romance", "bicycle", "festival",
  "traditions,city_break", "europe", "asia", "africa", "north_america", "south_america", "oceania", "mountains", "church",
  "drinks", "aurora_borealis", "coffee", "theme_park", "monarchy", "science", "bussines", "casino", "mythology", "wild"];
  let tagsObjects = [];
  for (let i = 0; i < tags.length; i++){
    tagsObjects.push({
      id: i+1,
      name: tags[i],
      check: false
    })
  }
  //console.log(JSON.stringify(tagsObjects));

  function getTagById(id){
    return tagsObjects[tagsObjects.map(function(x) {return x.id; }).indexOf(id)];
  }

  function getTagByName(name){
    return tagsObjects[tagsObjects.map(function(x) {return x.name; }).indexOf(name)];
  }

  function checkTags(tagsList){
    for (let tagString of tagsList){
      const tag = getTagByName(tagString);
      tag.check = true;
    }
  }

  function submit(){
    let questionsList = [];
    for (const question of $scope.questions){
      let answersList = [];
      for (const answer of question.answers){
        if (answer.check){
          answersList.push(answer);
        }
      }
      questionsList.push({
        id: question.id,
        answers: answersList
      })
    }

    console.log(questionsList);
    console.log($scope.data.age)
    console.log($scope.data.gender)

    WebService.post("/user/data",{
      age: $scope.data.age,
      gender: $scope.data.gender,
      questions: questionsList
    })
    .then(function(){
      window.history.back();
    })


  }



  function initQuestions(){

    $scope.questionsFromServer = [{
      id: 1,
      answers: [{
        id: 1
      },{ id: 2}]
    }]


    for (const question of $scope.questions){
      let answersList = getAnswerForQuestion($scope.questionsFromServer, question.id)
      for (const answer of question.answers){
        if (answersList.indexOf(answer.id-1)!== -1){
          answer.check = true;
        } else {
          answer.check = false;
        }
      }
    }
  }

  function getAnswerForQuestion(questionsFromServer, id){
    let answersChecked = [];
    if (!questionsFromServer[id-1]){
      return [];
    }
      for (const answer of questionsFromServer[id-1].answers){
          answersChecked.push(answer.id);
      }
    return answersChecked;
  }



  function main(){
    initScope();
  }



  const questions = [
    {
      id: 1,
      text:"3. What kind of holiday are you looking for:",
      advice: "Just be honest",
      answers: [
        {
          id: 1,
          text: "City break"
        },
        {
          id: 2,
          text: "Cultural"
        },
        {
          id: 3,
          text: "Family"
        },
        {
          id: 4,
          text: "Cruise Ship"
        },
        {
          id: 5,
          text: "Romantic"
        },
        {
          id: 6,
          text: "Party",
        },
        {
          id: 7,
          text: "Luxury"
        },
        {
          id: 8,
          text: "Pilgrimage"
        }
      ]
    },
    {
      id: 2,
      text:"4. What time of the year would you like to travel?",
      advice: "Just be honest",
      answers: [
        {
          id: 1,
          text: "Spring"
        },
        {
          id: 2,
          text: "Summer"
        },
        {
          id: 3,
          text: "Autumn"
        },
        {
          id: 4,
          text: "Winter"
        },
        {
          id: 5,
          text: "Holidays"
        }
      ]
    },
    {
      id: 3,
      text:"5. Price Range:",
      advice: "Just be honest",
      answers: [
        {
          id: 1,
          text: "<200 E"
        },
        {
          id: 2,
          text: "200-500 E"
        },
        {
          id: 3,
          text: "500-1000 E"
        },
        {
          id: 4,
          text: ">1000"
        }
      ]
    },
    {
      id: 4,
      text:"6. How would you spend your daytime in your perfect holiday destination?",
      advice: "Just be honest",
      answers: [
        {
          id: 1,
          text: "Shopping"
        },
        {
          id: 2,
          text: "On the beach"
        },
        {
          id: 3,
          text: "Adventure"
        },
        {
          id: 4,
          text: "Theme Park"
        },
        {
          id: 5,
          text: "Clubbing"
        },
        {
          id: 5,
          text: "Visiting attractions"
        }
      ]
    },
    {
      id: 5,
      text:"7. Interests:",
      advice: "Just be honest",
      answers: [
        {
          id: 1,
          text: "History"
        },
        {
          id: 2,
          text: "Sports"
        },
        {
          id: 3,
          text: "Music"
        },
        {
          id: 4,
          text: "Science"
        },
        {
          id: 5,
          text: "Food"
        },
        {
          id: 5,
          text: "Architecture"
        },
        {
          id: 6,
          text: "Religion"
        }
      ]
    },
    {
      id: 5,
      text:"8.What views are best for you?",
      advice: "Just be honest",
      answers: [
        {
          id: 1,
          text: "Panoramic Sea Views"
        },
        {
          id: 2,
          text: "Panoramic Mountains View"
        },
        {
          id: 3,
          text: "Countryside"
        },
        {
          id: 4,
          text: "Desert and sand"
        },
        {
          id: 5,
          text: "Animals, tradition, dancing and singing"
        }
      ]
    },
    {
      id: 5,
      text:"9.Where would you like to stay?",
      advice: "Just be honest",
      answers: [
        {
          id: 1,
          text: "In a Semi-Jungle Accomadation"
        },
        {
          id: 2,
          text: "In a Holiday Village"
        },
        {
          id: 3,
          text: "In a Beach Hotel"
        },
        {
          id: 4,
          text: "In a 5 star hotel"
        },
        {
          id: 5,
          text: "Camping"
        }
      ]
    },
    {
      id: 5,
      text:"10.Would you rather:",
      advice: "Just be honest",
      answers: [
        {
          id: 1,
          text: "Visit a Michelin-starred restaurant"
        },
        {
          id: 2,
          text: "See monkeys swinging in the trees"
        },
        {
          id: 3,
          text: "Take in spectacular views and landscapes"
        },
        {
          id: 4,
          text: "Visit an ancient city"
        }
      ]
    }

  ];



  function initScope(){
    $scope.checkTags = checkTags;
    $scope.submit = submit;
    $scope.questions = questions;
    console.log(JSON.stringify($scope.questions));
    initQuestions();
  }
  main();
});
