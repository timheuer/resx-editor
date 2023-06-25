import * as vscode from 'vscode';
import { window, ExtensionContext } from 'vscode';
import { newResourceInput } from './addNewResource';

export async function addNewResourceHandler (context: ExtensionContext) {
    // get all the inputs we need
    const inputs = newResourceInput(context);
};