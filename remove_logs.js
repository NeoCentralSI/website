import fs from 'fs';
import path from 'path';

function removeConsoleLogs(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            removeConsoleLogs(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let newContent = content;

            let idx = newContent.indexOf('console.log(');
            while (idx !== -1) {
                // Find the beginning of the line/whitespace to cleanly remove indentation
                let startIdx = idx;
                while (startIdx > 0 && (newContent[startIdx - 1] === ' ' || newContent[startIdx - 1] === '\t')) {
                    startIdx--;
                }

                let open = 0;
                let i = idx + 'console.log'.length; // index of '('
                let foundEnd = false;

                for (; i < newContent.length; i++) {
                    if (newContent[i] === '(') open++;
                    if (newContent[i] === ')') {
                        open--;
                        if (open === 0) {
                            let endIdx = i + 1;
                            if (newContent[endIdx] === ';') endIdx++;
                            if (newContent[endIdx] === '\r') endIdx++;
                            if (newContent[endIdx] === '\n') endIdx++;

                            newContent = newContent.substring(0, startIdx) + newContent.substring(endIdx);
                            foundEnd = true;
                            break;
                        }
                    }
                }

                if (!foundEnd) break; // prevent infinite loop if parsing fails
                idx = newContent.indexOf('console.log(');
            }

            if (content !== newContent) {
                console.info(`Cleaned console.log in ${fullPath}`);
                fs.writeFileSync(fullPath, newContent, 'utf8');
            }
        }
    }
}

const targetDir = path.join(process.cwd(), 'src');
console.info(`Starting console.log cleanup in: ${targetDir}`);
removeConsoleLogs(targetDir);
console.info('Done.');
