---
layout: post
title:  "Ring-wise continuous deployment"
date:   2020-08-15 10:47:53 +0600
categories: continuous delivery

comments: true
---
# DevOps cycle today

![Devops cycle](/assets/devopsCycle.png)

There is a continuous struggle happenning in today's software delivery landscape.  On one side are the developers, delivery managers, business owners who would like to make their work (product features) available to the customers quickly and on the other hand are the QA engineers, the devops engineers, who would like to take some time to ensure that we avoid regressions and service outages at all cost while we deliver those new features.  Both sides have valid points, delivering features quickly seems to be a key component of capturing market share on the other hand, service outage causes the users real pain and translates into revenue loss, and in the worst case, loss of market share or user base.

Well, that is easy, how about we hire an army of amazing engineers who write flawless code with 100% unit test coverage? - we can just push that code to production quickly, right?

> Testing (unit, manual, etc.) can only ensure the presense of bugs, not the absence.

True story: during a service incident, a number of engineers in my team had to spend days debugging an issue caused by a *single instance* of case-sensitive string comparison. 
 
# Ring-based deployment
So, what is the answer?

![Deployment rings](/assets/deployment-rings.jpg)


{% if page.comments %}

<div id="disqus_thread"></div>
<script>

/**
*  RECOMMENDED CONFIGURATION VARIABLES: EDIT AND UNCOMMENT THE SECTION BELOW TO INSERT DYNAMIC VALUES FROM YOUR PLATFORM OR CMS.
*  LEARN WHY DEFINING THESE VARIABLES IS IMPORTANT: https://disqus.com/admin/universalcode/#configuration-variables*/
/*
var disqus_config = function () {
// this.page.url = 'https://nobelk.github.io';  // Replace PAGE_URL with your page's canonical URL variable
this.page.identifier = '3'; // Replace PAGE_IDENTIFIER with your page's unique identifier variable
};
*/
(function() { // DON'T EDIT BELOW THIS LINE
var d = document, s = d.createElement('script');
s.src = 'https://EXAMPLE.disqus.com/embed.js';
s.setAttribute('data-timestamp', +new Date());
(d.head || d.body).appendChild(s);
})();
</script>
<noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a></noscript>

{% endif %}
