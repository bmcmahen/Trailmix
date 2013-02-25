createFeatures = (json) ->
  for feature in json
    _.extend feature, trail: Session.get 'currentTrail'
    Features.insert(feature)


Template.editSidebar.helpers

  trail: ->
    current = Session.get 'currentTrail'
    Trails.findOne current if current

  features: ->
    currentTrail = Session.get 'currentTrail'
    Features.find( trail : currentTrail) if currentTrail

  featuresTab: ->
    Session.equals 'tabView', 'features'

  descriptionTab: ->
    Session.equals 'tabView', 'description'

  addFeaturesTab: ->
    Session.equals 'tabView', 'addFeatures'


Template.editSidebar.created = ->
  Session.set 'tabView', 'description'


Template.editSidebar.rendered = ->

  $(window).on 'dragover', (e) ->
    e.preventDefault()
    $('#features').addClass 'dragover'

  $(window).on 'dragleave', (e) ->
    $('#features').removeClass 'dragover'

  $(window).on 'drop', (e) ->
    e.preventDefault()


Template.editSidebar.events

  'drop #features': (e, t) ->
    e.preventDefault()
    $(e.currentTarget).removeClass 'dragover'
    files = e.dataTransfer.files

    # Check that we have files or support FileReader
    return unless files? or window.FileReader?

    reader = new FileReader()
    reader.onload = (e) ->
      Trailmix.Utils.GPXtoGeoJSON e.target.result, (json) ->
        createFeatures json
    reader.readAsText files[0]

  'submit #trail-info': (e, t) ->
    e.preventDefault()
    name = t.find('.name').value
    desc = t.find('.description').value

    Trails.update _id: @_id,
      '$set'
        name: name
        description desc

    return false

  # Upon input, if we are in tagging mode then we want to keep track
  # of the start index of our query, and the end index of our query.
  'input textarea': (e) ->
    @endTagging = ->
      delete @start
      delete @end
      @tagging = false
      Session.set 'taggingQuery', null

    if @tagging
      currentPos = @textarea.selectionStart

      if currentPos - @start < 0
        @endTagging()
        return

      @start = currentPos unless @start?

      if @start is 0 then @textarea.selectionStart = 1
      else if @textarea.value.charAt @start is '@'
        @start += 1

      if currentPos > @end + 1 or currentPos < @start
        @endTagging()
        return

      if not @end or currentPos > @end
        @end = @textarea.selectionStart + 1

      query = @textarea.value.substring @start, @end + 1
      Session.set 'taggingQuery', query

    'keydown textarea': (e) ->
      @key = e.which
      @selectionLength = null
      @textarea = $('#trail-description')[0] unless @textarea?
      if @tagging
        @selectionLength = @textarea.selectionEnd - @textarea.selectionStart

      # Detect @symbol
      if e.shiftKey and e.which is 50
        @endTagging() if @tagging
        @tagging = true


    Template.editSidebar.destroyed = ->
      $(window).off 'dragover, dragleave, drop'


    # Feature Template
    Template.feature.events

      'click .delete-feature': ->
        Features.remove @_id

      'click .edit-feature': ->
        Trailmix.map.editFeature this

      'click .edit-trail': ->
        Session.set 'isEditing', true

      'click .feature-instance': ->
        Session.set 'selectedFeature', @_id
        Trailmix.map.highlightFeature @_id


    Template.feature.helpers

      # Highlight the currently selected feature
      selected : ->
        Session.equals 'selectedFeature', @_id


    Template.feature.preserve
      'img[id]' : (node) -> node.id




