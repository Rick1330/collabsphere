#!/usr/bin/env ruby
# frozen_string_literal: true

require "yaml"
require "pathname"

ROOT = Pathname.new(__dir__).join("..", "..").expand_path
QUEUE_ROOT = ROOT.join(".github", "queue")
INDEX_PATH = QUEUE_ROOT.join("index.yaml")

def fail_with(message)
  warn(message)
  exit(1)
end

def require_hash(value, context)
  fail_with("#{context} must be a mapping.") unless value.is_a?(Hash)
  value
end

def require_array(value, context)
  fail_with("#{context} must be a sequence.") unless value.is_a?(Array)
  value
end

def require_key(hash, key, context)
  fail_with("#{context} is missing required key #{key.inspect}.") unless hash.key?(key)
  hash[key]
end

fail_with("Queue manifest index not found: #{INDEX_PATH}") unless INDEX_PATH.exist?

index = require_hash(YAML.safe_load(INDEX_PATH.read), "index.yaml")
fail_with("index.yaml version must be 1.") unless index["version"] == 1

projects = require_array(index["projects"], "index.yaml projects")
fail_with("index.yaml projects must not be empty.") if projects.empty?

project_count = 0
story_count = 0
task_count = 0

projects.each do |project_entry|
  project = require_hash(project_entry, "project entry")
  project_id = require_key(project, "id", "project entry")
  project_issue = require_key(project, "issue", "project #{project_id}")
  project_validation_issue = require_key(project, "validation_issue", "project #{project_id}")
  project_file = require_key(project, "file", "project #{project_id}")

  project_path = QUEUE_ROOT.join(project_file)
  fail_with("Referenced project file does not exist: #{project_path}") unless project_path.exist?

  project_manifest = require_hash(YAML.safe_load(project_path.read), project_path.to_s)
  fail_with("#{project_path} version must be 1.") unless project_manifest["version"] == 1

  manifest_project = require_hash(project_manifest["project"], "#{project_path} project")
  fail_with("#{project_path} project id mismatch.") unless manifest_project["id"] == project_id
  fail_with("#{project_path} project issue mismatch.") unless manifest_project["issue"] == project_issue

  manifest_validation = require_hash(
    manifest_project["validation"],
    "#{project_path} project.validation",
  )
  fail_with("#{project_path} validation issue mismatch.") unless manifest_validation["issue"] == project_validation_issue

  stories = require_array(project_manifest["stories"], "#{project_path} stories")
  fail_with("#{project_path} stories must not be empty.") if stories.empty?

  stories.each do |story_entry|
    story = require_hash(story_entry, "#{project_path} story")
    require_key(story, "id", "#{project_path} story")
    require_key(story, "issue", "#{project_path} story")
    require_key(story, "title", "#{project_path} story")

    story_validation = require_hash(story["validation"], "#{project_path} story.validation")
    require_key(story_validation, "id", "#{project_path} story.validation")
    require_key(story_validation, "issue", "#{project_path} story.validation")

    tasks = require_array(story["tasks"], "#{project_path} story.tasks")
    tasks.each do |task_entry|
      task = require_hash(task_entry, "#{project_path} task")
      require_key(task, "id", "#{project_path} task")
      require_key(task, "issue", "#{project_path} task")
      require_key(task, "title", "#{project_path} task")
      task_count += 1
    end

    story_count += 1
  end

  project_count += 1
end

puts("Queue manifest validated successfully.")
puts("Projects: #{project_count}")
puts("Stories: #{story_count}")
puts("Implementation tasks: #{task_count}")
