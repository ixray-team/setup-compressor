import * as core from "@actions/core";
import * as github from "@actions/github";
import * as io from "@actions/io";
import * as os from "os";
import * as fs from "fs";
import * as request from "request";
import * as compressing from "compressing";
import * as path from "path";

async function extractRelease(input)
{
    return new Promise((resolve, reject) =>
    {
        request.get({
            url: `https://github.com/ixray-team/ixray-${input}/releases/latest`,
            followRedirect: false
        },
        (error, response, body) =>
        {
            if (error)
            {
                reject(error);
                return;
            }

            if (response.statusCode === 302)
            {
                const strings = response.headers.location.split('/');
                const release = strings[strings.length - 1];
                core.debug(`release: ${release}`);
                resolve(release);
            }
            else
            {
                reject(new Error(`Recieved ${response.statusCode} from ${url}`));
            }
        });
    });
}

function getBranch(input)
{
    switch (input)
    {
        case "1.6-stcop":
            return "1.6";
        default:
            throw new Error(`Not supported branch!`);
    }
}

function getArchitecture()
{
    const architecture = os.arch();
    switch (architecture)
    {
        case "ia32":
            return "x86";
        case "x64":
            return "x64";
        default:
            throw new Error(`Not supported architecture!`);
    }
}

async function downloadAsBuffer(url)
{
    return new Promise((resolve, reject) =>
    {
        core.info(`Downloading file ${url}`);
        request.get({ url, encoding: null }, (error, responce, body) =>
        {
            if (error)
            {
                reject(error);
                return;
            }

            if (responce.statusCode >= 400)
            {
                reject(new Error(`Recieved ${responce.statusCode} from ${url}`));
            }
            else
            {
                core.info(`Download complete`);
                resolve(body);
            }
        });
    });
}

function moveFiles(sourceDirectory, destionationDirectory)
{
    return new Promise((resolve, reject) =>
    {
        fs.readdir(sourceDirectory, (error, files) =>
        {
            if (error)
            {
                reject(error);
                return;
            }

            files.forEach((file) =>
            {
                const oldPath = path.join(sourceDirectory, file);
                const newPath = path.join(destionationDirectory, file);

                fs.rename(oldPath, newPath, (error) =>
                {
                    if (error)
                    {
                        reject(error);
                        return;
                    }

                    if (files.indexOf(file) === files.length - 1)
                    {
                        resolve();
                    }
                });
            });
        });
    });
}

async function run()
{
    const platform = os.platform();
    if (platform !== "win32")
    {
        throw new Error(`Not supported platform!`);
    }

    try
    {
        const codebase = core.getInput("codebase");
        core.debug(`codebase: ${codebase}`);

        const release = core.getInput("release");
        core.debug(`release: ${release}`);

        let latestRelease = release;
        if (release === "latest")
        {
            latestRelease = await extractRelease(codebase);
        }

        const branch = getBranch(codebase);
        const architecture = getArchitecture().toString();
        const url =
            release === "latest"
                ? `https://github.com/ixray-team/ixray-${codebase}/releases/latest/download/ixray-${branch}-r${latestRelease}-utilities-${architecture}-release-bin.zip`
                : `https://github.com/ixray-team/ixray-${codebase}/releases/download/r${release}/ixray-${branch}-r${release}-utilities-${architecture}-release-bin.zip`;
        core.debug(`branch: ${branch}`);
        core.debug(`architecture: ${architecture}`);
        core.debug(`url: ${url}`);

        const destionation = "bin";
        await io.mkdirP(destionation);

        const temp = "temp";
        await io.mkdirP(temp);

        const buffer = await downloadAsBuffer(url);
        await compressing.zip.uncompress(buffer, temp);

        await moveFiles(path.join(temp, "bin", "Release"), destionation);
        io.rmRF(temp);

        const filename = "xrCompress.exe";
        const filepath = path.join(destionation, filename);
        fs.chmodSync(filepath, "755");
        core.info(`Successfully installed IX-Ray Compressor ${release}`);

        core.addPath(destionation);
        core.info(`Successfully added IX-Ray Compressor to PATH`);
    }
    catch (error)
    {
        core.setFailed(error.message);
    }
}

run();
