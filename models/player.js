/**
 * Created by meyerzinn on 12/18/15.
 */
var mongoose = require("mongoose"), Schema = mongoose.Schema;

var PlayerSchema = new Schema({
    uuid: {type: String, required: true},
    coins: {type: Number, default: 0}
});
module.exports = mongoose.model('Player', PlayerSchema);