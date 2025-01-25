
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

interface ChatMessageResponse {
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

export async function MakeChatRequest(modelName:string,chatMessages:string[]){
    const ollamaEndpoint=GetApiEndpoint();

    const messages=chatMessages.map((message:string)=>{return {role:"user",content:message}});
    const MakeChatRequestFullUrl=ollamaEndpoint+"/api/chat";
    try {


        const response=await fetch(MakeChatRequestFullUrl,{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
            },
            body:JSON.stringify({model:modelName,stream:false,messages:[...messages]}),
        });
        const data=await response.json();
        return {data: data as ChatMessageResponse,error:false};

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


function GetApiEndpoint(){
        return "http://localhost:11434"
}