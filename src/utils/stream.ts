import { MyPromise } from 'the-promise';
import { spinOperation } from '../screen/spinner';

export function readFromInputStream()
{
    const stream = process.stdin;

    const spinner = spinOperation('Reading manifests from stdin...');

    let receivedSomething = false;

    const timer = setTimeout(() => {
        spinner.update('Reading manifests from stdin. Did you pipe something?')
    }, 5 * 1000);

    const terminateTimer = () => {
        clearTimeout(timer);
    }

    return MyPromise.construct<string>((resolve, reject) =>
    {
        let data = '';
        stream.on('readable', () => {
            const chunk = stream.read();
            if (chunk !== null) {
                data += chunk;

                if (!receivedSomething) {
                    receivedSomething = true;
                    terminateTimer();
                }
            }
        });

        stream.on('end', () => {
            terminateTimer();
            spinner.complete('Received manifests from stdin.');
            resolve(data);
        });

        stream.on('error', (err) => {
            terminateTimer();
            spinner.fail(`Failed to read from stdin. ${err}`);
            reject(err);
        });
    });
}
