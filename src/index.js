import { Buffer } from "node:buffer";
import * as core from "@actions/core";
import * as github from "@actions/github";
import * as io from "@actions/io";
import * as os from "os";
import * as fs from "fs";
import * as compressing from "compressing";
import * as path from "path";

async function extractRelease(input)
{
    const url = `https://github.com/ixray-team/ixray-${input}/releases/latest`;
    const response = await fetch(url, {
        redirect: "manual"
    });

    if (response.status === 302)
    {
        const location = response.headers.get("location");
        const strings = location.split("/");
        const release = strings[strings.length - 1];
        core.debug(`release: ${release}`);
        return release;
    }

    throw new Error(`Received ${response.status} from ${url}`);
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
    core.info(`Downloading file ${url}`);
    const response = await fetch(url);

    if (!response.ok)
    {
        throw new Error(`Received ${response.status} from ${url}`);
    }

    core.info(`Download complete`);
    return Buffer.from(await response.arrayBuffer());
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
                ? `https://github.com/ixray-team/ixray-${codebase}/releases/latest/download/ixray-${branch}-${latestRelease}-utilities-${architecture}-mixed-bin.zip`
                : `https://github.com/ixray-team/ixray-${codebase}/releases/download/r${release}/ixray-${branch}-r${release}-utilities-${architecture}-mixed-bin.zip`;
        core.debug(`branch: ${branch}`);
        core.debug(`architecture: ${architecture}`);
        core.debug(`url: ${url}`);

        const destionation = "bin";
        await io.mkdirP(destionation);

        const temp = "temp";
        await io.mkdirP(temp);

        const buffer = await downloadAsBuffer(url);
        await compressing.zip.uncompress(buffer, temp);

        await moveFiles(path.join(temp, "bin", "RelWithDebInfo"), destionation);
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
