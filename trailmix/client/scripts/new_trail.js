// Flow:

// Modal asking for new trail, basically acting like
// a shitty 'wizard' (oh god, nightmares...)
// 
// PROMPT: Ask for Trail Name. (then we can scan to see if it already exists
// and provide a warning if it does.)
// PROMPT: Ask for Data Source. (accept gpx)
// Create Trail (published === false)
//
// PROMPT: for a point of origin. 
// Update our trail w/Point Of Origin, and add it as a feature.
// 
// Allow the user to build the map in the usual way.
// 
// MAKE IT CLEAR: that the map is either private or public. once
// it is public, there is no going back. 