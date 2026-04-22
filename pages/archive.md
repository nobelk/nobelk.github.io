---
layout: page
title: Archive
permalink: /archive/
pagefind: false
---

{% if site.posts.size == 0 %}
No posts yet — check back soon.
{% else %}
{% assign posts_by_year = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
{% for year in posts_by_year %}

## {{ year.name }}

<ul class="archive-list">
{% for post in year.items %}
  <li>
    <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%b %-d" }}</time>
    <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
  </li>
{% endfor %}
</ul>
{% endfor %}
{% endif %}
