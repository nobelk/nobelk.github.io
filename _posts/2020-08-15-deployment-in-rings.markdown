---
layout: post
title:  "Ring-wise continuous deployment"
description: An example post which shows code rendering.
date:   2020-08-15 10:47:53 +0600
categories: continuous delivery
---

There is a continuous struggle happenning in today's software delivery landscape.  On one side are the developers, delivery managers, business owners who would like to make their work (product features) available to the users quickly and on the other hand are the QA engineers, the devops engineers, who would like to take some time to ensure that we avoid regressions and service outages at all cost while we deliver those new features.  

Both sides have valid points, delivering features quickly seems to be a key component of capturing market share on the other hand, service outage causes the users real pain and translates into revenue loss, and in the worst case, loss of market share or user base.

![Devops cycle](/assets/devopsCycle.png)

Well, how about we hire an army of amazing engineers who write flawless code with 100% unit test coverage? - we can just push that code to production quickly, right?

> Testing (unit, manual, etc.) can only ensure the presense of bugs, not the absence.

True story: during a service incident, a number of engineers in my team had to spend days debugging an issue caused by a *single instance* of case-sensitive string comparison. 
 
# Ring-wise deployment

Over time, all software components increase its interdependencies with other components within the architectures.  When we deploy a sizeable change in a component or a new component, the probability of the introduction of bugs increases.  These could be caused by logical errors, by faulty code, and or integration issues.  Given this high probability, there needs to be a way to mitigate any negative impact on the customer bases while we deploy code to the production environment.

Ring-wise continuous deployment is one such method to mitigate the risk of customer impact while achieving high velocity of feature delivery.

![Deployment rings](/assets/deployment-rings.jpg)

> Concept: Divide all environments where the software component is available into several rings of availability.  Starting from the developer's machine (Ring 0), to the final production environment (Ring 3).  Continually deploy and *test* software features from one ring to the next until it is available to all users. 

The exact implementation of the rings depends on the type of software, the team, and the target user base, one such definition for a moderate-sized team could be:

| Ring | Description | Types of testing |
| -----|-------------|------------------- |
| Ring 0 | Developer's machine | unit tests, functional tests, manual tests |
| -------|---------------------|-------------------------------------------- |
| Ring 1 | Staging/release environment | integration testing |
| -------|-----------------------------|---------------------- |
| Ring 2 | Production preview | testing in production, monitoring |
| -------|---------------------|----------------------------------- |
| Ring 3 | Production | testing in production, performances |
| -------|------------|-------------------------------------- |