'use strict';

module.exports = function(Code) {
    Code.validatesInclusionOf('type', { in: ['activate', 'reset']
});

};
