import { window, Disposable, QuickInput, QuickInputButtons, ExtensionContext } from 'vscode';
import { AppConstants } from './utilities/constants';

export async function newResourceInput(context: ExtensionContext) {


	interface State {
		title: string;
		step: number;
		totalSteps: number;
		key: string;
		value: string;
		comment: string | string;
	}

	async function collectInputs() {
		const state = {} as Partial<State>;
		await MultiStepInput.run(input => inputKey(input, state));
		return state as State;
	}

	const title = AppConstants.addNewTitle;

	async function inputKey(input: MultiStepInput, state: Partial<State>) {
		state.key = await input.showInputBox({
			title,
			step: 1,
			totalSteps: 3,
			value: state.key || '',
			prompt: AppConstants.promptKeyName,
			validate: validateNotNull,
			shouldResume: shouldResume
		});
		return (input: MultiStepInput) => inputValue(input, state);
	}

	async function inputValue(input: MultiStepInput, state: Partial<State>) {
		state.value = await input.showInputBox({
			title,
			step: 2,
			totalSteps: 3,
			value: state.value || '',
			prompt: AppConstants.promptValueName,
			validate: validateNotNull,
			shouldResume: shouldResume
		});
		return (input: MultiStepInput) => inputComment(input, state);
	}

	async function inputComment(input: MultiStepInput, state: Partial<State>) {
		state.comment = await input.showInputBox({
			title,
			step: 3,
			totalSteps: 3,
			value: state.comment || '',
			prompt: AppConstants.promptCommentName,
			validate: validateNotNull,
			shouldResume: shouldResume
		});
	}

	function shouldResume() {
		return Promise.resolve(false);
	}

	async function validateNotNull(name: string): Promise<string | undefined> {
		return name === '' ? 'Must not be empty' : undefined;
	}

	const state = await collectInputs();

	return state;
}


// -------------------------------------------------------
// Helper code that wraps the API for the multi-step case.
// -------------------------------------------------------

enum InputFlowAction {
	back,
	cancel,
	resume
}

type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

interface InputBoxParameters {
	title: string;
	step: number;
	totalSteps: number;
	value: string;
	prompt: string;
	placeholder?: string;
	validate: (value: string) => Promise<string | undefined>;
	shouldResume: () => Thenable<boolean>;
}

class MultiStepInput {

	static async run<T>(start: InputStep) {
		const input = new MultiStepInput();
		return input.stepThrough(start);
	}

	private current?: QuickInput;
	private steps: InputStep[] = [];

	private async stepThrough<T>(start: InputStep) {
		let step: InputStep | void = start;
		while (step) {
			this.steps.push(step);
			if (this.current) {
				this.current.enabled = false;
				this.current.busy = true;
			}
			try {
				step = await step(this);
			} catch (err) {
				if (err === InputFlowAction.back) {
					this.steps.pop();
					step = this.steps.pop();
				} else if (err === InputFlowAction.resume) {
					step = this.steps.pop();
				} else if (err === InputFlowAction.cancel) {
					step = undefined;
				} else {
					throw err;
				}
			}
		}
		if (this.current) {
			this.current.dispose();
		}
	}

	async showInputBox<P extends InputBoxParameters>({ title, step, totalSteps, value, prompt, validate, shouldResume, placeholder }: P) {
		const disposables: Disposable[] = [];
		try {
			return await new Promise<string | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
				const input = window.createInputBox();
				input.title = title;
				input.step = step;
				input.totalSteps = totalSteps;
				input.value = value || '';
				input.prompt = prompt;
				input.buttons = [
					...(this.steps.length > 1 ? [QuickInputButtons.Back] : [])
				];
				input.placeholder = placeholder;
				let validating = validate('');
				disposables.push(
					input.onDidTriggerButton(item => {
						if (item === QuickInputButtons.Back) {
							reject(InputFlowAction.back);
						} else {
							resolve(<any>item);
						}
					}),
					input.onDidAccept(async () => {
						const value = input.value;
						input.enabled = false;
						input.busy = true;
						if (!(await validate(value))) {
							resolve(value);
						}
						input.enabled = true;
						input.busy = false;
					}),
					input.onDidChangeValue(async text => {
						const current = validate(text);
						validating = current;
						const validationMessage = await current;
						if (current === validating) {
							input.validationMessage = validationMessage;
						}
					}),
					input.onDidHide(() => {
						(async () => {
							reject(shouldResume && await shouldResume() ? InputFlowAction.resume : InputFlowAction.cancel);
						})()
							.catch(reject);
					})
				);
				if (this.current) {
					this.current.dispose();
				}
				this.current = input;
				this.current.show();
			});
		} finally {
			disposables.forEach(d => d.dispose());
		}
	}
}