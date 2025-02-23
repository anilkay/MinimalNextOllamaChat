
export interface ModelResult {
    models: Model[];
}
export interface Model {
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details: Details;
}
export interface Details {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
}

export interface ChatMessageWithRoles {
    message: string,
    role: 'user' | 'assistant' | 'system'
    images: string[] | null
}

export interface  OptionsType {
    temperature: number
    seed?: number
}

interface RequestBodyType {
    options: OptionsType;
    model: string;
    stream: boolean;
    messages: ChatMessageMessageRequest[];
    system?: string;
}


export async function GetModels(){

    const ollamaEndpoint=GetApiEndpoint();

    const GetModelsFullUrl=ollamaEndpoint+"/api/tags";
    try {


        const response=await fetch(GetModelsFullUrl,{
            method:"GET",
            headers:{
                "Content-Type":"application/json",
            },
        });
        const data=await response.json();
        return {data: data as ModelResult,error:false};
    }
    catch(e){
        console.error(e);
        return {data: null,error:true};
    }
}

export interface ChatMessageMessageRequest {
    content: string;
    role: 'user' | 'assistant' | 'system'
    images?: string[] | null
}

export interface ChatMessageResponse {
    model: string;
    created_at: string;
    message: Message;
    done_reason: string;
    done: boolean;
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
}
interface Message {
    role: string;
    content: string;
}

export const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = () => {
            const base64String = reader.result as string;
            const base64Data = base64String.split(',')[1]; // Get only the data part
            resolve(base64Data);
        };

        reader.onerror = (error) => {
             if (!(error instanceof Error)) {
                reject(new Error('An unexpected error occurred: '));
            } 
            else {
                reject(error);
           }
};
    });


export async function MakeChatRequest(temperature:number,seedUsage:boolean,seedValue:number,systemPromptUsage:boolean,systemPrompt:string,modelName:string,chatMessages:ChatMessageWithRoles[]){
    const ollamaEndpoint=GetApiEndpoint();
    const messages:ChatMessageMessageRequest[] =chatMessages.map((chatMessage:ChatMessageWithRoles)=>{return {role:chatMessage.role,content:chatMessage.message,images:chatMessage.images}});

    if(systemPromptUsage && messages.findIndex(x => x.role === "system")<0){
        messages.unshift({role:"system",content:systemPrompt,images:null});
    }

    const MakeChatRequestFullUrl=ollamaEndpoint+"/api/chat";
    try {
        const options:OptionsType={temperature:temperature};

        if(seedUsage){
            options["seed"]=seedValue;
        }
        
        const requestBody:RequestBodyType={options:options,model:modelName,stream:false,messages:messages}

      
        const response=await fetch(MakeChatRequestFullUrl,{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
            },
            body:JSON.stringify(requestBody),
        });
        const data=await response.json();

        return {data: data as ChatMessageResponse,error:response.status!=200};

    }
    catch(e){
        console.error(e);
        return {data: null,error:true};
    }
}

export async function PullModel(modelName:string)
{
    const ollamaEndpoint=GetApiEndpoint();

    const PullModelFullUrl=ollamaEndpoint+"/api/pull";
    try {


        const data=await fetch(PullModelFullUrl,{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
            },
            body:JSON.stringify({model:modelName,stream:false}),
        });
        return {data: data,error:false};

    }
    catch(e){
        return {data: e,error:true};
    }

}


export async function DeleteModel(modelName:string){
    const ollamaEndpoint=GetApiEndpoint();

    const DeleteModelFullUrl=ollamaEndpoint+"/api/delete";
    try {


        const data=await fetch(DeleteModelFullUrl,{
            method:"DELETE",
            headers:{
                "Content-Type":"application/json",
            },
            body:JSON.stringify({name:modelName}),
        });
        return {data: data,error:false};

    }
    catch(e){
        return {data: e,error:true};
    }

}


export function GetApiEndpoint(){
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL; 

    if (!apiBaseUrl) {
        return "http://localhost:11434"; 
    }

    return apiBaseUrl;
}