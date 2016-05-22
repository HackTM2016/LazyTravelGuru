travelApp.factory('SessionService', function(){

  function setData(key, value){
    sessionStorage.setItem(key,value);
  }

  function getData(key){
    return sessionStorage.getItem(key)
  }

  function isLoggedIn(){
    return  getData('usernameTravelApp') !== undefined && getData('usernameTravelApp') !== 'null';
  }

  function login(user, password){
    setData('usernameTravelApp',user);
  }

  function logout(){
    setData('usernameTravelApp', 'null');
  }

  function getUserName(){
    return getData('usernameTravelApp');
  }

  return {
    login,
    isLoggedIn,
    logout,
    getUserName
  }
})
