require 'rake'

SITE_DIR = '_site'.freeze

desc 'Build the site into _site (honors JEKYLL_ENV)'
task :build do
  sh 'bundle exec jekyll build'
end

desc 'Serve the site locally with live reload at http://localhost:4000'
task :serve do
  sh 'bundle exec jekyll serve --livereload --drafts'
end

desc 'Validate the existing _site with html-proofer (does not rebuild)'
task :test do
  unless Dir.exist?(SITE_DIR)
    abort "#{SITE_DIR}/ not found — run `rake build` first."
  end

  require 'html-proofer'
  HTMLProofer.check_directory(
    SITE_DIR,
    disable_external: true,
    enforce_https: true,
    check_html: true,
    allow_missing_href: false
  ).run
end

task default: :build
