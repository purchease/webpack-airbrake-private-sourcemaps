const fs = require('fs');

/*
 * Airbrake extract plugin
 * - projectId: string - airbrake project id
 * - projectKey: string - airbrake project key
 * - directories: array[string] - directories to scan for sourcemaps
 * - host: string - website url
 * - logging: boolean - enables logs
 */
function AirbrakePlugin(options) {
    this.options = Object.assign({}, options);
}

AirbrakePlugin.prototype.apply = function(compiler) {
    /*
     * Get options values
     */
    const { url, projectId, projectKey, host, logging } = this.options;

    /*
     * Upload file to sourcemaps
     */
    const uploadFile = (path, file) => {
        const filePath = path + '/' + file;

        if (file.slice(-4) === '\.map' && !fs.lstatSync(filePath).isDirectory()) {
            if (logging) {
                console.log(`- will upload file: ${filePath}`);
            }

            const postData = {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'multipart/form-data'
                },
                formData: {
                    file: fs.createReadStream(filePath),
                    name: `${host}/${file}`,
                    buffer: new Buffer([1, 2, 3])
                },
            };

            request.post(url, postData, (err, httpResponse, body) => {
                if (err) {
                    return console.error('Error: upload failed - ', err);
                }

                if (logging) {
                    console.log('--- uploaded file: ', filePath);
                    console.log('posted to:', url);
                    console.log('post data:', postData);
                    console.log('Server responded with:', body);
                }
            });
        } else if (logging) {
            console.log(`- won't upload file: ${filePath}`);
        }
    };


    /*
     * Upload sourcemaps after compilation is complete
     */
    compiler.plugin('done', (compilation) => {
        const { directories } = this.options;
        console.log('Starting Airbrake sourcemaps upload...');

        if (!projectId) {
            console.error('- Airbrake projectId is required');
        }

        if (!projectKey) {
            console.error('- Airbrake projectKey is required');
        }

        if (!host) {
            console.error('- Sourcemaps web host is required');
        }

        if (!url) {
            console.error('- Airbrake project url is required');
        }

        if (!directories || !directories.length) {
            console.error('- Sourcemap directories value is required');
        }

        if (!projectId || !projectKey || !host || !url || !directories) {
            console.error('- All config values are required to upload airbrake sourcemaps');
        }

        if (directories && directories.length) {
            directories.forEach(dir => {
                if (logging) {
                    console.log('- Scanning directory:', dir);
                }

                if (fs.existsSync(dir)) {
                    fs.readdirSync(dir).forEach(file => {
                        uploadFile(dir, file);
                    });
                } else if (logging) {
                    console.log(`- directory: ${dir} not available`);
                }
            });
        }
    });
};

module.exports = AirbrakePlugin;
