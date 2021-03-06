// Port of https://github.com/github/hubot-scripts/blob/master/src/scripts/ferengi_rules_of_acquisition.coffee

module.exports = function (commander, logger) {

  commander.script({
    help: 'A spy for replying with Ferengi Rules of Acquisition'
  });

  commander.spy({
    hear: /\b(money|profit|sale|discount|opportunity)\b/i,
    help: 'Replies with a Ferengi Rule of Acquisition',
    opts: {format: 'html'},
    action: action
  });

  function action(event, response) {
    response.random([
      'Ferengi Rule of Acquisition #1: <b>"Once you have their money, you never give it back."</b> <i>-- ST:DS9, \'The Nagus\', \'Heart of Stone\'</i>',
      'Ferengi Rule of Acquisition #3: <b>"Never pay more for an acquisition than you have to."</b> <i>-- ST:DS9, \'The Maquis, Part II\'</i>',
      'Ferengi Rule of Acquisition #6: <b>"Never allow family to stand in the way of opportunity."</b> <i>-- ST:DS9, \'The Nagus\'</i>',
      'Ferengi Rule of Acquisition #7: <b>"Keep your ears open."</b> <i>-- ST:DS9, \'In the Hands of the Prophets\'</i>',
      'Ferengi Rule of Acquisition #8: <b>"Small print leads to large risk."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #9: <b>"Opportunity plus instinct equals profit."</b> <i>-- ST:DS9, The Storyteller',
      'Ferengi Rule of Acquisition #10: <b>"Greed is eternal."</b> <i>-- ST:DS9, Prophet Motive',
      'Ferengi Rule of Acquisition #13: <b>"Anything worth doing is worth doing for money."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #16: <b>"A deal is a deal... until a better one comes along."</b> <i>-- ST:DS9, \'Melora\'</i>',
      'Ferengi Rule of Acquisition #17: <b>"A contract is a contract is a contract... but only between Ferengi."</b> <i>-- ST:DS9, \'Body Parts\'</i>',
      'Ferengi Rule of Acquisition #18: <b>"A Ferengi without profit is no Ferengi at all."</b> <i>-- ST:DS9, \'Heart of Stone\'</i>',
      'Ferengi Rule of Acquisition #19: <b>"Satisfaction is not guaranteed."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #21: <b>"Never place friendship above profit."</b> <i>-- ST:DS9, \'Rule of Acquisition\'</i>',
      'Ferengi Rule of Acquisition #22: <b>"A wise man can hear profit in the wind."</b> <i>-- ST:DS9, \'Rule of Acquisition\'</i>',
      'Ferengi Rule of Acquisition #27: <b>"There is nothing more dangerous than an honest businessman."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #28: <b>"Whisper your way to success."</b> <i>-- ST:DS9, \'Treachery, Faith, and the Great River\'</i>',
      'Ferengi Rule of Acquisition #31: <b>"Never make fun of a Ferengi\'s mother."</b> <i>-- ST:DS9, \'The Siege\'</i>',
      'Ferengi Rule of Acquisition #33: <b>"It never hurts to suck up to the boss."</b> <i>-- ST:DS9, \'Rule of Acquisition\', \'The Dogs of War\'</i>',
      'Ferengi Rule of Acquisition #34: <b>"War is good for business."</b> <i>-- ST:DS9, \'Destiny\'</i>',
      'Ferengi Rule of Acquisition #35: <b>"Peace is good for business."</b> <i>-- ST:DS9, \'The Perfect Mate\'; ST:TNG, \'Destiny\'</i>',
      'Ferengi Rule of Acquisition #40: <b>"She can touch your lobes, but never your latinum."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #41: <b>"Profit is its own reward."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #44: <b>"Never confuse wisdom with luck."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #47: <b>"Never trust a man wearing a better suit than your own."</b> <i>-- ST:DS9, \'Rivals\'</i>',
      'Ferengi Rule of Acquisition #48: <b>"The bigger the smile, the sharper the knife."</b> <i>-- ST:DS9, \'Rule of Acquisition\'</i>',
      'Ferengi Rule of Acquisition #52: <b>"Never ask when you can take."</b> <i>-- ST:DS9, \'Rule of Acquisition\'</i>',
      'Ferengi Rule of Acquisition #57: <b>"Good customers are as rare as latinum. Treasure them."</b> <i>-- ST:DS9, \'Armageddon Game\'</i>',
      'Ferengi Rule of Acquisition #58: <b>"There is no substitute for success."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #59: <b>"Free advice is seldom cheap."</b> <i>-- ST:DS9, \'Rule of Acquisition\'</i>',
      'Ferengi Rule of Acquisition #60: <b>"Keep your lies consistent."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #62: <b>"The riskier the road, the greater the profit."</b> <i>-- ST:DS9, \'Rule of Acquisition\'</i>',
      'Ferengi Rule of Acquisition #65: <b>"Win or lose, there\'s always Hupyrian beetle snuff."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #75: <b>"Home is where the heart is, but the stars are made of latinum."</b> <i>-- ST:DS9, \'Civil Defense\'</i>',
      'Ferengi Rule of Acquisition #76: <b>"Every once in a while, declare peace. It confuses the hell out of your enemies."</b> <i>-- ST:DS9, \'The Homecoming\'</i>',
      'Ferengi Rule of Acquisition #79: <b>"Beware of the Vulcan greed for knowledge."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #82: <b>"The flimsier the product, the higher the price."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #85: <b>"Never let the competition know what you\'re thinking."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #89: <b>"Ask not what your profits can do for you, but what you can do for your profits."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #94: <b>"Females and finances don\'t mix."</b> <i>-- ST:DS9, \'Ferengi Love Songs\'</i>',
      'Ferengi Rule of Acquisition #97: <b>"Enough ... is never enough."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #98: <b>"Every man has his price."</b> <i>-- ST:DS9, \'In the Pale Moonlight\'</i>',
      'Ferengi Rule of Acquisition #99: <b>"Trust is the biggest liability of all."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #102: <b>"Nature decays, but latinum lasts forever."</b> <i>-- ST:DS9, \'The Jem\'Hadar\'</i>',
      'Ferengi Rule of Acquisition #103: <b>"Sleep can interfere with your lust for latinum.5 <i>-- ST:DS9, \'Rule of Acquisition\'</i>',
      'Ferengi Rule of Acquisition #104: <b>"Faith moves mountains ... of inventory."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #106: <b>"There is no honor in poverty."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #109: <b>"Dignity and an empty sack is worth the sack."</b> <i>-- ST:DS9, \'Rivals\'</i>',
      'Ferengi Rule of Acquisition #111: <b>"Treat people in your debt like family... exploit them."</b> <i>-- ST:DS9, \'Past Tense, Part I\', \'The Darkness and the Light\'</i>',
      'Ferengi Rule of Acquisition #112: <b>"Never have sex with the boss\'s sister."</b> <i>-- ST:DS9, \'Playing God\'</i>',
      'Ferengi Rule of Acquisition #113: <b>"Always have sex with the boss."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #121: <b>"Everything is for sale, even friendship."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #123: <b>"Even a blind man can recognize the glow of latinum."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #125: <b>"You can\'t make a deal if you\'re dead."</b> <i>-- ST:DS9, \'The Siege of AR-558\'</i>',
      'Ferengi Rule of Acquisition #139: <b>"Wives serve, brothers inherit."</b> <i>-- ST:DS9, \'Necessary Evil\'</i>',
      'Ferengi Rule of Acquisition #141: <b>"Only fools pay retail."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #144: <b>"There\'s nothing wrong with charity... as long as it winds up in your pocket."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #162: <b>"Even in the worst of times, someone turns a profit."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #168: <b>"Whisper your way to success."</b> <i>-- ST:DS9, \'Treachery, Faith, and the Great River\'</i>',
      'Ferengi Rule of Acquisition #177: <b>"Know your enemies... but do business with them always."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #181: <b>"Not even dishonesty can tarnish the shine of profit."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #189: <b>"Let others keep their reputation. You keep their latinum."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #190: <b>"Hear all, trust nothing."</b> <i>-- ST:DS9, \'Call to Arms\'</i>',
      'Ferengi Rule of Acquisition #192: <b>"Never cheat a Klingon ... unless you can get away with it."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #194: <b>"It\'s always good to know about new customers before they walk in your door."</b> <i>-- ST:DS9, \'Whispers\'</i>',
      'Ferengi Rule of Acquisition #202: <b>"The justification for profit is profit."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #203: <b>"New customers are like razor-toothed gree worms. They can be succulent, but sometimes they bite back."</b> <i>-- ST:DS9, \'Little Green Men\'</i>',
      'Ferengi Rule of Acquisition #208: <b>"Sometimes the only thing more dangerous than the question is an answer."</b> <i>-- ST:DS9, \'Ferengi Love Songs\'</i>',
      'Ferengi Rule of Acquisition #211: <b>"Employees are the rungs on the ladder of success. Don\'t hesitate to step on them."</b> <i>-- ST:DS9, \'Bar Association\'</i>',
      'Ferengi Rule of Acquisition #214: <b>"Never begin a negotiation on an empty stomach."</b> <i>-- ST:DS9, \'The Maquis, Part I\'</i>',
      'Ferengi Rule of Acquisition #217: <b>"You can\'t free a fish from water."</b> <i>-- ST:DS9, \'Past Tense, Part I\'</i>',
      'Ferengi Rule of Acquisition #218: <b>"Always know what you\'re buying."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #223: <b>"Beware the man who doesn\'t make time for oo-mox."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #229: <b>"Latinum lasts longer than lust."</b> <i>-- ST:DS9, \'Ferengi Love Songs\'</i>',
      'Ferengi Rule of Acquisition #236: <b>"You can\'t buy fate."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #239: <b>"Never be afraid to mislabel a product."</b> <i>-- ST:DS9, \'Body Parts\'</i>',
      'Ferengi Rule of Acquisition #242: <b>"More is good. All is better."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #255: <b>"A wife is a luxury ... a smart accountant a necessity."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #261: <b>"A wealthy man can afford anything except a conscience."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #266: <b>"When in doubt, lie."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #263: <b>"Never let doubt interfere with your lust for latinum."</b> <i>-- ST:DS9, \'Bar Association\'</i>',
      'Ferengi Rule of Acquisition #284: <b>"Deep down, everyone\'s a Ferengi."</b> <i>-- ST: Legends of the Ferengi',
      'Ferengi Rule of Acquisition #285: <b>"No good deed ever goes unpunished."</b> <i>-- ST:DS9, \'The Collaborator\''
    ]);
  }

};
