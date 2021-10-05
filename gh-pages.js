var ghpages = require('gh-pages');

ghpages.publish(
    'public', // path to public directory
    {
        branch: 'gh-pages',
        repo: 'https://github.com/MorningPants/CSS-Color-Guesser.git', 
        user: {
            name: 'Andy', // update to use your name
            email: 'andyghopkins@gmail.com' // Update to use your email
        }
    },
    () => {
        console.log('Deploy Complete!')
    }
)